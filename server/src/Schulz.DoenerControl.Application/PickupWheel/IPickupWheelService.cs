using Schulz.DoenerControl.Application.OrderDays;
using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Application.PickupWheel;

public interface IPickupWheelService
{
    // Spins the Glücksrad for today's Döner-Tag when the deadline has passed, nobody is Abholer yet
    // and the wheel has not spun today. Returns whether a spin happened. Safe to call repeatedly.
    Task<bool> SpinIfDueAsync(CancellationToken ct);

    // The person the wheel chose has a VERY important reason: they drop off the wheel for the day
    // and it spins again among the remaining participants.
    Task<Result<OrderDayDetails>> ExcuseAsync(
        ExcusePickupWheelCommand command,
        CancellationToken ct
    );
}
