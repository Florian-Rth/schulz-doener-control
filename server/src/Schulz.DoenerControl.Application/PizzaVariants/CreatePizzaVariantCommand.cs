namespace Schulz.DoenerControl.Application.PizzaVariants;

// Admin create-pizza-variant input. Icon is optional (null = no symbol). The service assigns the id.
public sealed record CreatePizzaVariantCommand(
    string Name,
    string? Icon,
    int SortOrder,
    bool IsAvailable
);
