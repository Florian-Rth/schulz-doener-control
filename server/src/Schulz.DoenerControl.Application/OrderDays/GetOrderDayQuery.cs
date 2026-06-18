namespace Schulz.DoenerControl.Application.OrderDays;

// Reads a single Döner-Tag by id, projected relative to the requesting caller.
public sealed record GetOrderDayQuery(Guid CallerUserId, Guid OrderDayId);
