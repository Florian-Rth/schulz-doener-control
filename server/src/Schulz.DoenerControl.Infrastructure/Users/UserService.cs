using Microsoft.EntityFrameworkCore;
using Schulz.DoenerControl.Application.Calculators;
using Schulz.DoenerControl.Application.Users;
using Schulz.DoenerControl.Core;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Infrastructure.Persistence;

namespace Schulz.DoenerControl.Infrastructure.Users;

public sealed class UserService : IUserService
{
    private readonly AppDbContext database;

    public UserService(AppDbContext database)
    {
        this.database = database;
    }

    public async Task<Result<CurrentUserDetails>> GetMeAsync(Guid callerId, CancellationToken ct)
    {
        var user = await database.Users.FirstOrDefaultAsync(
            candidate => candidate.Id == callerId,
            ct
        );

        if (user is null)
            return Result<CurrentUserDetails>.NotFound("Benutzer nicht gefunden.");

        return Result<CurrentUserDetails>.Success(Map(user));
    }

    private static CurrentUserDetails Map(User user) =>
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
}
