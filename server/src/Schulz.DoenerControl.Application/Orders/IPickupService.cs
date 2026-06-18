using Schulz.DoenerControl.Application.OrderDays;
using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Application.Orders;

public interface IPickupService
{
    Task<Result<PickupResult>> ClaimAsync(ClaimPickupCommand command, CancellationToken ct);

    Task<Result<PickupResult>> ReleaseAsync(ReleasePickupCommand command, CancellationToken ct);

    // Designates the single collector for the day. Returns the updated day projection relative to
    // the caller (the same shape every day endpoint returns).
    Task<Result<OrderDayDetails>> SetCollectorAsync(
        SetCollectorCommand command,
        CancellationToken ct
    );
}
