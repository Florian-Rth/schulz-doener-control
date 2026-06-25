using System.Diagnostics.Contracts;
using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Application.Calculators;

// Ports the mock's productLabel/detail builders. The product label is "Pizza {Variant}" for pizza
// or "{ProductName} {Meat}" for döner; the description joins the sauce label and any extra wish with
// " · ", falling back to "Standard". Sauces are stored as a flags enum and rendered in the canonical
// vocabulary order (Kräuter, Knoblauch, Scharf) to match the order screen.
//
// The pizza variant is now admin-managed reference data (not a closed enum), so callers resolve the
// variant Name before calling this pure calculator and pass it in as pizzaVariantName.
public static class OrderLabelBuilder
{
    private const string NoSauceLabel = "ohne Soße";
    private const string StandardLabel = "Standard";
    private const string Separator = " · ";

    [Pure]
    public static string BuildProductLabel(
        ProductKind kind,
        string productName,
        MeatType? meat,
        string? pizzaVariantName
    ) =>
        kind == ProductKind.Pizza
            ? $"Pizza {pizzaVariantName ?? string.Empty}".TrimEnd()
            : $"{productName} {MeatLabel(meat)}";

    [Pure]
    public static string BuildDescription(ProductKind kind, Sauce sauces, string? extra)
    {
        var sauceLabel = kind == ProductKind.Pizza ? string.Empty : SauceLabel(sauces);
        var parts = new[] { sauceLabel, extra }.Where(part => !string.IsNullOrWhiteSpace(part));
        var joined = string.Join(Separator, parts);
        return joined.Length == 0 ? StandardLabel : joined;
    }

    [Pure]
    private static string SauceLabel(Sauce sauces)
    {
        if (sauces == Sauce.None)
            return NoSauceLabel;

        var names = new List<string>(3);
        if (sauces.HasFlag(Sauce.Kraeuter))
            names.Add("Kräuter");
        if (sauces.HasFlag(Sauce.Knoblauch))
            names.Add("Knoblauch");
        if (sauces.HasFlag(Sauce.Scharf))
            names.Add("Scharf");

        return names.Count == 0 ? NoSauceLabel : string.Join(", ", names);
    }

    [Pure]
    private static string MeatLabel(MeatType? meat) =>
        meat switch
        {
            MeatType.Kalb => "Kalb",
            MeatType.Haehnchen => "Hähnchen",
            MeatType.Gemischt => "Gemischt",
            _ => string.Empty,
        };
}
