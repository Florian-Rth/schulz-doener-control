namespace Schulz.DoenerControl.Application.Orders;

// Reads the caller's own order for a day to prefill the order screen on edit. A null result value
// means the caller has not ordered yet (the UI renders an empty form).
public sealed record GetMyOrderQuery(Guid CallerUserId, Guid OrderDayId);
