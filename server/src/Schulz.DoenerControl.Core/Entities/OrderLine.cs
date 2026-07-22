namespace Schulz.DoenerControl.Core.Entities;

// A single ordered item within an Order header. Answers describes the item (the chosen options and
// free text, keyed by field key — see LineAnswers), replacing the old typed Meat/Sauces/PizzaVariant/
// Kind/Extra columns. PriceCents is the per-UNIT price frozen at order time (snapshot, immune to
// later menu/price edits); Quantity (>= 1) is how many of this exact item were ordered. The header's
// total is the sum over its lines of Quantity * PriceCents.
public sealed class OrderLine
{
    public Guid Id { get; set; }

    public Guid OrderId { get; set; }

    public required string ProductId { get; set; }

    // The item's configured answers. Never null: an item with no fields carries LineAnswers.Empty.
    public LineAnswers Answers { get; set; } = LineAnswers.Empty;

    // Per-unit price, frozen at order time.
    public int PriceCents { get; set; }

    public int Quantity { get; set; }

    public Order? Order { get; set; }
}
