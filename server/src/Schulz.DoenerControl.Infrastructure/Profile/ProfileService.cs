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

        user.PayPalHandle = PayPalHandleParsing.FromLink(command.Handle);
        await database.SaveChangesAsync(ct);

        return Result<ProfileDetails>.Success(Map(user));
    }

    public async Task<Result<ProfileDetails>> UpdateDisplayNameAsync(
        UpdateDisplayNameCommand command,
        CancellationToken ct
    )
    {
        var user = await FindAsync(command.UserId, ct);
        if (user is null)
            return Result<ProfileDetails>.NotFound("Benutzer nicht gefunden.");

        user.DisplayName = command.DisplayName.Trim();
        await database.SaveChangesAsync(ct);

        return Result<ProfileDetails>.Success(Map(user));
    }

    public async Task<Result<ProfileDetails>> UpdateWorkEmailAsync(
        UpdateWorkEmailCommand command,
        CancellationToken ct
    )
    {
        var user = await FindAsync(command.CallerUserId, ct);
        if (user is null)
            return Result<ProfileDetails>.NotFound("Benutzer nicht gefunden.");

        user.WorkEmail = string.IsNullOrWhiteSpace(command.WorkEmail)
            ? null
            : command.WorkEmail.Trim();
        await database.SaveChangesAsync(ct);

        return Result<ProfileDetails>.Success(Map(user));
    }

    private static ProfileDetails Map(User user) =>
        new(
            user.Id,
            user.DisplayName,
            NameFormatter.FirstNameOf(user.DisplayName),
            NameFormatter.InitialsOf(user.DisplayName),
            user.AvatarColorHex,
            user.Role,
            // The stored value is the bare handle; the user only ever sees a link, so reconstruct it.
            PayPalLinkBuilder.BuildLink(user.PayPalHandle, null),
            !string.IsNullOrWhiteSpace(user.PayPalHandle),
            user.WorkEmail,
            !string.IsNullOrWhiteSpace(user.WorkEmail)
        );

    private Task<User?> FindAsync(Guid callerId, CancellationToken ct) =>
        database.Users.FirstOrDefaultAsync(candidate => candidate.Id == callerId, ct);
}
