using Microsoft.EntityFrameworkCore;
using Schulz.DoenerControl.Application.Calculators;
using Schulz.DoenerControl.Application.Profile;
using Schulz.DoenerControl.Core;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Infrastructure.Persistence;

namespace Schulz.DoenerControl.Infrastructure.Profile;

public sealed class ProfileService : IProfileService
{
    private readonly AppDbContext database;

    public ProfileService(AppDbContext database)
    {
        this.database = database;
    }

    public async Task<Result<ProfileDetails>> GetAsync(Guid callerId, CancellationToken ct)
    {
        var user = await FindAsync(callerId, ct);
        if (user is null)
            return Result<ProfileDetails>.NotFound("Benutzer nicht gefunden.");

        return Result<ProfileDetails>.Success(Map(user));
    }

    public async Task<Result<ProfileDetails>> UpdatePayPalHandleAsync(
        UpdatePayPalHandleCommand command,
        CancellationToken ct
    )
    {
        var user = await FindAsync(command.CallerUserId, ct);
        if (user is null)
            return Result<ProfileDetails>.NotFound("Benutzer nicht gefunden.");

        user.PayPalHandle = Normalize(command.Handle);
        await database.SaveChangesAsync(ct);

        return Result<ProfileDetails>.Success(Map(user));
    }

    // A blank handle is the user clearing it; store null so PayPalHandleSet is false and the
    // payment buttons disable. A real handle is stored trimmed.
    private static string? Normalize(string? handle) =>
        string.IsNullOrWhiteSpace(handle) ? null : handle.Trim();

    private static ProfileDetails Map(User user) =>
        new(
            user.Id,
            user.DisplayName,
            NameFormatter.FirstNameOf(user.DisplayName),
            NameFormatter.InitialsOf(user.DisplayName),
            user.AvatarColorHex,
            user.Role,
            user.PayPalHandle,
            !string.IsNullOrWhiteSpace(user.PayPalHandle)
        );

    private Task<User?> FindAsync(Guid callerId, CancellationToken ct) =>
        database.Users.FirstOrDefaultAsync(candidate => candidate.Id == callerId, ct);
}
