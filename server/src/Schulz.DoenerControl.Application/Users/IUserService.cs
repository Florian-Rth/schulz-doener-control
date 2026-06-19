using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Application.Users;

public interface IUserService
{
    Task<Result<CurrentUserDetails>> GetMeAsync(Guid callerId, CancellationToken ct);

    Task<Result<IReadOnlyList<AdminUserSummary>>> ListAsync(CancellationToken ct);

    Task<Result<ProvisionedUserDetails>> CreateAsync(
        CreateUserCommand command,
        CancellationToken ct
    );

    Task<Result<AdminUserSummary>> UpdateAsync(UpdateUserCommand command, CancellationToken ct);

    Task<Result> DeactivateAsync(Guid userId, CancellationToken ct);

    Task<Result<ProvisionedUserDetails>> ResetPasswordAsync(Guid userId, CancellationToken ct);
}
