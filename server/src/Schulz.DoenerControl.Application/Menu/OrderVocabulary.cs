using System.Collections.ObjectModel;

namespace Schulz.DoenerControl.Application.Menu;

// The closed choice sets for configuring an order, in the German display form the mock uses
// (PIZZAS / SAUCES / MEAT). Kept as the single source of truth so the order screen and the
// PutMyOrder validator agree on the exact vocabulary without re-typing the strings.
public static class OrderVocabulary
{
    public static readonly IReadOnlyList<string> PizzaVariants = new ReadOnlyCollection<string>([
        "Salami",
        "Margherita",
        "Funghi",
        "Tonno",
        "Hawaii",
    ]);

    public static readonly IReadOnlyList<string> SauceOptions = new ReadOnlyCollection<string>([
        "Kräuter",
        "Knoblauch",
        "Scharf",
    ]);

    public static readonly IReadOnlyList<string> MeatOptions = new ReadOnlyCollection<string>([
        "Kalb",
        "Hähnchen",
    ]);
}
