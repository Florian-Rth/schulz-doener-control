namespace Schulz.DoenerControl.Core.Entities;

// One turn of the Abholer-Glücksrad: when nobody volunteered as Abholer by the deadline, the wheel
// picks a participant. Round 1 is the automatic deadline spin; every later round is a re-spin
// triggered by the previously chosen person excusing themselves (ExcusedAt set on their round).
// The wheel's candidates are derived, not stored: the day's orders created before SpunAt, minus
// everyone excused in an earlier round.
public sealed class PickupWheelSpin
{
    public Guid Id { get; set; }

    public Guid OrderDayId { get; set; }

    public int Round { get; set; }

    public Guid ChosenUserId { get; set; }

    public DateTimeOffset SpunAt { get; set; }

    public DateTimeOffset? ExcusedAt { get; set; }

    public OrderDay? OrderDay { get; set; }

    public User? ChosenUser { get; set; }
}
