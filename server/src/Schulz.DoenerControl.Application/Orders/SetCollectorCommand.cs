namespace Schulz.DoenerControl.Application.Orders;

// Designates the single collector for a day (the person who pays the shop; every debt will point to
// them). The designated user must be a pickup on that day. Returns the updated day projection.
public sealed record SetCollectorCommand(Guid CallerUserId, Guid OrderDayId, Guid CollectorUserId);
