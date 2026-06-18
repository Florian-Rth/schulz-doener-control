using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Application.Users;

public interface IUserService
{
    Task<Result<CurrentUserDetails>> GetMeAsync(Guid callerId, CancellationToken ct);
}
