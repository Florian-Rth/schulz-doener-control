using System.Collections.ObjectModel;
using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Application.Menu;

// The closed choice sets for configuring an order, as the canonical ASCII enum tokens
// (Kraeuter/Haehnchen…, not the umlaut display forms). These are the exact strings the SPA's order
// schema enumerates and the PutMyOrder request carries, so the menu vocabulary, the validator and
// the frontend all agree on one wire form. The German display labels are a presentation concern the
// SPA maps locally. Pizza variants are NOT here: they are admin-managed reference data sourced from
// the PizzaVariants catalog at request time, not a closed enum.
public static class OrderVocabulary
{
    public static readonly IReadOnlyList<string> SauceOptions = new ReadOnlyCollection<string>([
        nameof(Sauce.Kraeuter),
        nameof(Sauce.Knoblauch),
        nameof(Sauce.Scharf),
    ]);

    public static readonly IReadOnlyList<string> MeatOptions = new ReadOnlyCollection<string>([
        nameof(MeatType.Kalb),
        nameof(MeatType.Haehnchen),
        nameof(MeatType.Gemischt),
    ]);
}
