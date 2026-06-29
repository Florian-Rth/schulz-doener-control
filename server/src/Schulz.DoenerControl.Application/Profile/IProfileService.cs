using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Application.Profile;

public interface IProfileService
{
    Task<Result<ProfileDetails>> GetAsync(Guid callerId, CancellationToken ct);

    Task<Result<ProfileDetails>> UpdatePayPalHandleAsync(
        UpdatePayPalHandleCommand command,
        CancellationToken ct
    );

    Task<Result<ProfileDetails>> UpdateDisplayNameAsync(
        UpdateDisplayNameCommand command,
        CancellationToken ct
    );

    Task<Result<ProfileDetails>> UpdateWorkEmailAsync(
        UpdateWorkEmailCommand command,
        CancellationToken ct
    );
}
