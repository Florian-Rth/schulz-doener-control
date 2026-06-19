using Microsoft.EntityFrameworkCore;
using Schulz.DoenerControl.Application.Calculators;
using Schulz.DoenerControl.Application.Security;
using Schulz.DoenerControl.Application.Users;
using Schulz.DoenerControl.Core;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Core.Enums;
using Schulz.DoenerControl.Infrastructure.Persistence;

namespace Schulz.DoenerControl.Infrastructure.Users;

public sealed class UserService : IUserService
{
    private const string UserNotFound = "Benutzer nicht gefunden.";
    private const string UsernameTaken = "Dieser Benutzername ist bereits vergeben.";
    private const string LastAdminGuard =
        "Der letzte aktive Administrator kann nicht herabgestuft oder deaktiviert werden.";

    private readonly AppDbContext database;
    private readonly IPasswordHasher passwordHasher;
    private readonly TimeProvider timeProvider;

    public UserService(
        AppDbContext database,
        IPasswordHasher passwordHasher,
        TimeProvider timeProvider
    )
    {
        this.database = database;
        this.passwordHasher = passwordHasher;
        this.timeProvider = timeProvider;
    }

    public async Task<Result<CurrentUserDetails>> GetMeAsync(Guid callerId, CancellationToken ct)
    {
        var user = await database.Users.FirstOrDefaultAsync(
            candidate => candidate.Id == callerId,
            ct
        );

        if (user is null)
            return Result<CurrentUserDetails>.NotFound(UserNotFound);

        return Result<CurrentUserDetails>.Success(MapCurrent(user));
    }

    public async Task<Result<IReadOnlyList<AdminUserSummary>>> ListAsync(CancellationToken ct)
    {
        var users = await database.Users.OrderBy(user => user.DisplayName).ToListAsync(ct);

        IReadOnlyList<AdminUserSummary> summaries = users.Select(MapSummary).ToList();
        return Result<IReadOnlyList<AdminUserSummary>>.Success(summaries);
    }

    public async Task<Result<ProvisionedUserDetails>> CreateAsync(
        CreateUserCommand command,
        CancellationToken ct
    )
    {
        var username = command.Username.Trim();
        var normalized = username.ToLowerInvariant();

        var exists = await database.Users.AnyAsync(
            candidate => candidate.NormalizedUserName == normalized,
            ct
        );
        if (exists)
            return Result<ProvisionedUserDetails>.Conflict(UsernameTaken);

        var temporaryPassword = TemporaryPasswordGenerator.Generate();
        var hashed = passwordHasher.Hash(temporaryPassword);

        var user = new User
        {
            Id = Guid.NewGuid(),
            Username = username,
            NormalizedUserName = normalized,
            DisplayName = command.DisplayName.Trim(),
            PayPalHandle = NormalizeHandle(command.PayPalHandle),
            PasswordHash = hashed.Hash,
            PasswordSalt = hashed.Salt,
            Role = command.Role,
            IsActive = true,
            MustChangePassword = true,
            AvatarColorHex = AvatarColorPalette.ForUsername(normalized),
            CreatedAt = timeProvider.GetUtcNow(),
        };

        database.Users.Add(user);
        await database.SaveChangesAsync(ct);

        return Result<ProvisionedUserDetails>.Success(
            new ProvisionedUserDetails(user.Id, user.Username, temporaryPassword)
        );
    }

    public async Task<Result<AdminUserSummary>> UpdateAsync(
        UpdateUserCommand command,
        CancellationToken ct
    )
    {
        var user = await database.Users.FirstOrDefaultAsync(
            candidate => candidate.Id == command.UserId,
            ct
        );
        if (user is null)
            return Result<AdminUserSummary>.NotFound(UserNotFound);

        var losesAdminPrivilege =
            (user.Role == UserRole.Admin && command.Role != UserRole.Admin)
            || (user.IsActive && !command.IsActive);

        if (losesAdminPrivilege && await IsLastActiveAdminAsync(user, ct))
            return Result<AdminUserSummary>.Conflict(LastAdminGuard);

        var revokeTokens = user.Role != command.Role || (user.IsActive && !command.IsActive);

        user.DisplayName = command.DisplayName.Trim();
        user.PayPalHandle = NormalizeHandle(command.PayPalHandle);
        user.Role = command.Role;
        user.IsActive = command.IsActive;

        if (revokeTokens)
            await RevokeAllForUserAsync(user.Id, ct);

        await database.SaveChangesAsync(ct);

        return Result<AdminUserSummary>.Success(MapSummary(user));
    }

    public async Task<Result> DeactivateAsync(Guid userId, CancellationToken ct)
    {
        var user = await database.Users.FirstOrDefaultAsync(
            candidate => candidate.Id == userId,
            ct
        );
        if (user is null)
            return Result.NotFound(UserNotFound);

        if (!user.IsActive)
            return Result.Success();

        if (user.Role == UserRole.Admin && await IsLastActiveAdminAsync(user, ct))
            return Result.Conflict(LastAdminGuard);

        user.IsActive = false;
        await RevokeAllForUserAsync(user.Id, ct);
        await database.SaveChangesAsync(ct);

        return Result.Success();
    }

    public async Task<Result<ProvisionedUserDetails>> ResetPasswordAsync(
        Guid userId,
        CancellationToken ct
    )
    {
        var user = await database.Users.FirstOrDefaultAsync(
            candidate => candidate.Id == userId,
            ct
        );
        if (user is null)
            return Result<ProvisionedUserDetails>.NotFound(UserNotFound);

        var temporaryPassword = TemporaryPasswordGenerator.Generate();
        var hashed = passwordHasher.Hash(temporaryPassword);

        user.PasswordHash = hashed.Hash;
        user.PasswordSalt = hashed.Salt;
        user.MustChangePassword = true;

        await RevokeAllForUserAsync(user.Id, ct);
        await database.SaveChangesAsync(ct);

        return Result<ProvisionedUserDetails>.Success(
            new ProvisionedUserDetails(user.Id, user.Username, temporaryPassword)
        );
    }

    // True only when this user is an active admin and no other active admin exists, so removing
    // their admin standing would leave the system with zero administrators.
    private async Task<bool> IsLastActiveAdminAsync(User user, CancellationToken ct)
    {
        if (user.Role != UserRole.Admin || !user.IsActive)
            return false;

        var otherActiveAdmins = await database.Users.CountAsync(
            candidate =>
                candidate.Id != user.Id && candidate.Role == UserRole.Admin && candidate.IsActive,
            ct
        );

        return otherActiveAdmins == 0;
    }

    // Mirrors AuthService: kill every outstanding refresh token so a role change or deactivation
    // forces the affected sessions to re-authenticate (access JWTs live out their short lifetime).
    private async Task RevokeAllForUserAsync(Guid userId, CancellationToken ct)
    {
        var now = timeProvider.GetUtcNow();
        var active = await database
            .RefreshTokens.Where(token => token.UserId == userId && token.RevokedAt == null)
            .ToListAsync(ct);

        foreach (var token in active)
            token.RevokedAt = now;
    }

    private static string? NormalizeHandle(string? handle) =>
        string.IsNullOrWhiteSpace(handle) ? null : handle.Trim();

    private static CurrentUserDetails MapCurrent(User user) =>
        new(
            user.Id,
            user.DisplayName,
            NameFormatter.FirstNameOf(user.DisplayName),
            NameFormatter.InitialsOf(user.DisplayName),
            user.AvatarColorHex,
            user.Role,
            user.PayPalHandle,
            !string.IsNullOrWhiteSpace(user.PayPalHandle),
            user.MustChangePassword
        );

    private static AdminUserSummary MapSummary(User user) =>
        new(
            user.Id,
            user.Username,
            user.DisplayName,
            user.Role,
            user.IsActive,
            user.MustChangePassword,
            user.PayPalHandle,
            user.CreatedAt
        );
}
