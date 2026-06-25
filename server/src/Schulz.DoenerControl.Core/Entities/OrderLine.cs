using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Core.Entities;

// A single ordered item within an Order header. Kind/Meat/PizzaVariantId/Sauces/Extra describe the
// item; PriceCents is the per-UNIT price frozen at order time (snapshot, immune to later menu/price
// edits); Quantity (>= 1) is how many of this exact item were ordered. The header's total is the sum
// over its lines of Quantity * PriceCents.
public sealed class OrderLine
{
    public Guid Id { get; set; }

    public Guid OrderId { get; set; }

    public required string ProductId { get; set; }

    public ProductKind Kind { get; set; }

    // Null for pizza orders.
    public MeatType? Meat { get; set; }

    // Null for doener-kind orders; otherwise a FK onto the admin-managed PizzaVariant catalog.
    public Guid? PizzaVariantId { get; set; }

    public Sauce Sauces { get; set; }

    // Per-unit price, frozen at order time.
    public int PriceCents { get; set; }

    public string? Extra { get; set; }

    public int Quantity { get; set; }

    public Order? Order { get; set; }

    public PizzaVariant? PizzaVariant { get; set; }
}
