namespace Schulz.DoenerControl.Core.Entities;

// The order HEADER: one row per user per day. The per-item facts live on its OrderLines; the header
// only carries the participant, the day, the pickup flag and the business timestamps. OccurredOn
// drives the 90-day tier window, monthly spend and streak, distinct from CreatedAt (row-insert
// instant). The lines' PriceCents are frozen at order time so history is immune to later menu/price
// edits.
public sealed class Order
{
    public Guid Id { get; set; }

    public Guid OrderDayId { get; set; }

    public Guid UserId { get; set; }

    public bool IsPickup { get; set; }

    // Business timestamp (drives the 90-day tier window, monthly spend and streak),
    // distinct from CreatedAt which is the row-insert instant.
    public DateTimeOffset OccurredOn { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }

    public OrderDay? OrderDay { get; set; }

    public User? User { get; set; }

    public ICollection<OrderLine> Lines { get; set; } = new List<OrderLine>();

    // The order total: sum over the lines of (Quantity * per-unit PriceCents). Not stored — always
    // derived from the lines so it can never drift from them.
    public int TotalCents => Lines.Sum(line => line.Quantity * line.PriceCents);
}
