using Microsoft.EntityFrameworkCore;
using Schulz.DoenerControl.Application.Security;
using Schulz.DoenerControl.Core;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Infrastructure.Persistence;

namespace Schulz.DoenerControl.Infrastructure.Security;

// Credential verification + refresh-token rotation against the real database. Authentication
// failures return Result.Validation with a single generic message; the endpoint maps that to 401
// so the client never learns which factor failed (bad password vs unknown user vs lockout). The
// constant fake hash defeats user-enumeration timing on unknown usernames.
public sealed class AuthService : IAuthService
{
    private const string GenericFailure = "Anmeldung fehlgeschlagen.";

    private static readonly TimeSpan RefreshLifetime = TimeSpan.FromDays(30);

    private static readonly byte[] DummyHash = new byte[32];
    private static readonly byte[] DummySalt = new byte[16];

    private readonly AppDbContext database;
    private readonly IPasswordHasher passwordHasher;
    private readonly ILoginLockout lockout;
    private readonly TimeProvider timeProvider;

    public AuthService(
        AppDbContext database,
        IPasswordHasher passwordHasher,
        ILoginLockout lockout,
        TimeProvider timeProvider
    )
    {
        this.database = database;
        this.passwordHasher = passwordHasher;
        this.lockout = lockout;
        this.timeProvider = timeProvider;
    }

    public async Task<Result<AuthenticatedUserDetails>> LoginAsync(
        LoginCommand command,
        CancellationToken ct
    )
    {
        var normalized = command.Username.Trim().ToLowerInvariant();

        if (lockout.IsLockedOut(normalized))
        {
            VerifyDummy(command.Password);
            return Result<AuthenticatedUserDetails>.Validation(GenericFailure);
        }

        var user = await database.Users.FirstOrDefaultAsync(
            candidate => candidate.NormalizedUserName == normalized,
            ct
        );

        if (user is null || !user.IsActive)
        {
            VerifyDummy(command.Password);
            lockout.RegisterFailure(normalized);
            return Result<AuthenticatedUserDetails>.Validation(GenericFailure);
        }

        if (!passwordHasher.Verify(command.Password, user.PasswordHash, user.PasswordSalt))
        {
            lockout.RegisterFailure(normalized);
            return Result<AuthenticatedUserDetails>.Validation(GenericFailure);
        }

        lockout.Reset(normalized);
        var rawRefreshToken = await IssueRefreshTokenAsync(user.Id, ct);
        return Result<AuthenticatedUserDetails>.Success(MapAuthenticated(user, rawRefreshToken));
    }

    public async Task<Result<AuthenticatedUserDetails>> RefreshAsync(
        string rawRefreshToken,
        CancellationToken ct
    )
    {
        var presentedHash = RefreshTokenCrypto.Hash(rawRefreshToken);
        var token = await database.RefreshTokens.FirstOrDefaultAsync(
            candidate => candidate.TokenHash == presentedHash,
            ct
        );

        if (token is null)
            return Result<AuthenticatedUserDetails>.Validation(GenericFailure);

        var now = timeProvider.GetUtcNow();

        if (token.RevokedAt is not null)
        {
            // Reuse of an already-revoked token signals theft/replay. With no family column on the
            // schema, revoke every refresh token for the user (the whole "family") and fail.
            await RevokeAllForUserAsync(token.UserId, now, ct);
            return Result<AuthenticatedUserDetails>.Validation(GenericFailure);
        }

        if (token.ExpiresAt <= now)
            return Result<AuthenticatedUserDetails>.Validation(GenericFailure);

        var user = await database.Users.FirstOrDefaultAsync(
            candidate => candidate.Id == token.UserId,
            ct
        );

        if (user is null || !user.IsActive)
            return Result<AuthenticatedUserDetails>.Validation(GenericFailure);

        var rawReplacement = await RotateAsync(token, now, ct);
        return Result<AuthenticatedUserDetails>.Success(MapAuthenticated(user, rawReplacement));
    }

    public async Task<Result> LogoutAsync(LogoutCommand command, CancellationToken ct)
    {
        var now = timeProvider.GetUtcNow();
        await RevokeAllForUserAsync(command.CallerUserId, now, ct);
        return Result.Success();
    }

    public async Task<Result> ChangePasswordAsync(
        ChangePasswordCommand command,
        CancellationToken ct
    )
    {
        var user = await database.Users.FirstOrDefaultAsync(
            candidate => candidate.Id == command.CallerUserId,
            ct
        );

        if (user is null)
            return Result.Validation(GenericFailure);

        if (!passwordHasher.Verify(command.CurrentPassword, user.PasswordHash, user.PasswordSalt))
            return Result.Validation(GenericFailure);

        var rehashed = passwordHasher.Hash(command.NewPassword);
        user.PasswordHash = rehashed.Hash;
        user.PasswordSalt = rehashed.Salt;
        user.MustChangePassword = false;

        // Force re-login everywhere: there is no token_version column to invalidate outstanding
        // access JWTs early, so they live out their short lifetime; refresh tokens are killed now.
        var now = timeProvider.GetUtcNow();
        await RevokeAllForUserAsync(user.Id, now, ct);
        await database.SaveChangesAsync(ct);
        return Result.Success();
    }

    private void VerifyDummy(string password) =>
        passwordHasher.Verify(password, DummyHash, DummySalt);

    private async Task<string> IssueRefreshTokenAsync(Guid userId, CancellationToken ct)
    {
        var rawToken = RefreshTokenCrypto.CreateRawToken();
        var now = timeProvider.GetUtcNow();
        database.RefreshTokens.Add(
            new RefreshToken
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                TokenHash = RefreshTokenCrypto.Hash(rawToken),
                CreatedAt = now,
                ExpiresAt = now + RefreshLifetime,
            }
        );
        await database.SaveChangesAsync(ct);
        return rawToken;
    }

    private async Task<string> RotateAsync(
        RefreshToken current,
        DateTimeOffset now,
        CancellationToken ct
    )
    {
        var rawReplacement = RefreshTokenCrypto.CreateRawToken();
        var replacementHash = RefreshTokenCrypto.Hash(rawReplacement);

        current.RevokedAt = now;
        current.ReplacedByTokenHash = replacementHash;

        database.RefreshTokens.Add(
            new RefreshToken
            {
                Id = Guid.NewGuid(),
                UserId = current.UserId,
                TokenHash = replacementHash,
                CreatedAt = now,
                ExpiresAt = now + RefreshLifetime,
            }
        );
        await database.SaveChangesAsync(ct);
        return rawReplacement;
    }

    private async Task RevokeAllForUserAsync(Guid userId, DateTimeOffset now, CancellationToken ct)
    {
        var active = await database
            .RefreshTokens.Where(token => token.UserId == userId && token.RevokedAt == null)
            .ToListAsync(ct);

        if (active.Count == 0)
            return;

        foreach (var token in active)
            token.RevokedAt = now;

        await database.SaveChangesAsync(ct);
    }

    private static AuthenticatedUserDetails MapAuthenticated(User user, string rawRefreshToken) =>
        new(
            user.Id,
            user.Username,
            user.DisplayName,
            user.Role,
            user.MustChangePassword,
            !string.IsNullOrWhiteSpace(user.PayPalHandle),
            rawRefreshToken
        );
}
