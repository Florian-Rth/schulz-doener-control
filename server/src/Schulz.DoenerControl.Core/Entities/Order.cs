using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Core.Entities;

// The atomic, source-of-truth record: one row per user per day. Every input the tier math
// and dashboard need is captured here, with Kind/PriceCents frozen at order time so history
// is immune to later menu/price edits.
public sealed class Order
{
    public Guid Id { get; set; }

    public Guid OrderDayId { get; set; }

    public Guid UserId { get; set; }

    public required string ProductId { get; set; }

    public ProductKind Kind { get; set; }

    // Null for pizza orders.
    public MeatType? Meat { get; set; }

    // Null for doener-kind orders.
    public PizzaVariant? PizzaVariant { get; set; }

    public Sauce Sauces { get; set; }

    public int PriceCents { get; set; }

    public string? Extra { get; set; }

    public bool IsPickup { get; set; }

    // Business timestamp (drives the 90-day tier window, monthly spend and streak),
    // distinct from CreatedAt which is the row-insert instant.
    public DateTimeOffset OccurredOn { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset UpdatedAt { get; set; }

    public OrderDay? OrderDay { get; set; }

    public User? User { get; set; }
}
