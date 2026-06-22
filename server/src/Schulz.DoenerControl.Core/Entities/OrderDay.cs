using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Core.Entities;

public sealed class OrderDay
{
    public Guid Id { get; set; }

    // The calendar business day. Unique index enforces one OrderDay per day.
    public DateOnly Date { get; set; }

    public OrderDayStatus Status { get; set; }

    // The random Doener synonym chosen at open time, stored so the home-screen
    // notification preview is reproducible after a refresh.
    public required string Synonym { get; set; }

    // Historical/audit value: the cutoff instant computed when the day was opened. After the
    // time-decoupling, ordering is gated by Status + OrderingClosedAt (not this), so it no longer
    // gates ordering and is not exposed on the wire.
    public DateTimeOffset OrderCutoffAt { get; set; }

    public Guid OpenedByUserId { get; set; }

    public DateTimeOffset OpenedAt { get; set; }

    public DateTimeOffset? ClosedAt { get; set; }

    // When the collector manually locks ordering ("Bestellung schließen"), before the time cutoff and
    // distinct from closing the whole day. Null = ordering still open.
    public DateTimeOffset? OrderingClosedAt { get; set; }

    // The single designated collector who pays the shop; null until designated.
    public Guid? CollectorUserId { get; set; }

    public User? OpenedByUser { get; set; }

    public User? CollectorUser { get; set; }

    public ICollection<Order>? Orders { get; set; }
}
