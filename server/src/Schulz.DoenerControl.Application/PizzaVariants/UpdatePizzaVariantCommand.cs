namespace Schulz.DoenerControl.Application.PizzaVariants;

// Admin update-pizza-variant input. Id targets an existing row (the id itself is immutable — it is
// the FK past orders froze onto). Icon is optional (null = no symbol).
public sealed record UpdatePizzaVariantCommand(
    Guid Id,
    string Name,
    string? Icon,
    int SortOrder,
    bool IsAvailable
);
