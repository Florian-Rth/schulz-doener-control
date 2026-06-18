namespace Schulz.DoenerControl.Application.Menu;

// The whole order vocabulary in one shape: the seeded menu items plus the closed choice sets
// (pizza variants, sauces, meats) so the SPA never hardcodes those enums client-side.
public sealed record MenuDetails(
    IReadOnlyList<MenuItemSummary> Items,
    IReadOnlyList<string> PizzaVariants,
    IReadOnlyList<string> SauceOptions,
    IReadOnlyList<string> MeatOptions
);
