namespace Schulz.DoenerControl.Application.Menu;

// The whole order vocabulary in one shape: the seeded menu items plus the choice sets. PizzaVariants
// is the admin-managed catalog as {value,label} pairs (value = the stable variant id string the
// order line carries on the wire, label = the German display name); sauces and meats stay closed
// enums the SPA never has to hardcode.
public sealed record MenuDetails(
    IReadOnlyList<MenuItemSummary> Items,
    IReadOnlyList<PizzaVariantOption> PizzaVariants,
    IReadOnlyList<string> SauceOptions,
    IReadOnlyList<string> MeatOptions
);

// One pizza-variant choice on the order form. Value is the variant id as a string (the wire value a
// pizza line submits); Label is the display name.
public sealed record PizzaVariantOption(string Value, string Label);
