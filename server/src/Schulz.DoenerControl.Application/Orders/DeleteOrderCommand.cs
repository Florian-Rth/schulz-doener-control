namespace Schulz.DoenerControl.Application.Orders;

// Withdraws the caller's order from a day. Only allowed while the day is open and before cutoff; a
// missing order is NotFound.
public sealed record DeleteOrderCommand(Guid CallerUserId, Guid OrderDayId);
