namespace Schulz.DoenerControl.Core.Entities;

// Admin-managed reference data (replaces the former static Core.Enums.PizzaVariant): the pizza
// sorts the order screen offers. Name is the display label rendered on the order chips and in
// "Pizza {Name}" labels; Icon is an optional Material symbol; SortOrder drives the chip order;
// IsAvailable gates whether the variant is offered on the public order form. OrderLine.PizzaVariantId
// is a nullable FK onto Id.
public sealed class PizzaVariant
{
    public Guid Id { get; set; }

    public required string Name { get; set; }

    public string? Icon { get; set; }

    public int SortOrder { get; set; }

    public bool IsAvailable { get; set; } = true;
}
