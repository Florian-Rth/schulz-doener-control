namespace Schulz.DoenerControl.Application.PizzaVariants;

// The full admin view of a single pizza variant, including IsAvailable. Id is the stable variant id
// the order line carries on the wire; the admin screen surfaces it as the row id.
public sealed record PizzaVariantDetails(
    Guid Id,
    string Name,
    string? Icon,
    int SortOrder,
    bool IsAvailable
);
