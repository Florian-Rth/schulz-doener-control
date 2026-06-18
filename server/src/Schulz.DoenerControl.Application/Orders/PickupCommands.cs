namespace Schulz.DoenerControl.Application.Orders;

// "Ich hole heute ab" — flips the caller's existing order to IsPickup=true. Requires an existing
// order on an open day.
public sealed record ClaimPickupCommand(Guid CallerUserId, Guid OrderDayId);

// Stop being a pickup for the day. Clears IsPickup on the caller's order while the day is open.
public sealed record ReleasePickupCommand(Guid CallerUserId, Guid OrderDayId);

// The pickup endpoints return the caller's updated order plus the day's full list of pickup names
// so the dashboard's Abholer line can re-render in one round-trip.
public sealed record PickupResult(OrderDetails Order, IReadOnlyList<string> AllPickupNames);
