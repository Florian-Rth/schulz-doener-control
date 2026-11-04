namespace Schulz.DoenerControl.Infrastructure.PickupWheel;

// When the Glücksrad spins if nobody volunteered as Abholer (local business time, default 12:00).
public sealed class PickupWheelOptions
{
    public const string DeadlineConfigKey = "PickupWheel:DeadlineLocalTime";

    public TimeOnly DeadlineLocalTime { get; set; } = new(12, 0);
}
