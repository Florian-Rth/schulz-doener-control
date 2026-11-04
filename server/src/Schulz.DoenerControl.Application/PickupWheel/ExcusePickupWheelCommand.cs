namespace Schulz.DoenerControl.Application.PickupWheel;

public sealed record ExcusePickupWheelCommand(Guid CallerUserId, Guid OrderDayId);
