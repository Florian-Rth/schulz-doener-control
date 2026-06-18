using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Api.Endpoints.Orders;

// Parses the request's order-vocabulary strings (the canonical enum names Kalb/Haehnchen,
// Salami…Hawaii, Kraeuter/Knoblauch/Scharf) into the Core enums for the command. The validator is
// the authority on which combinations are legal; this only maps the recognised tokens and folds the
// sauce list into the bit-flags enum.
public static class OrderVocabularyParser
{
    public static MeatType? ParseMeat(string? value) =>
        Enum.TryParse<MeatType>(value, ignoreCase: false, out var meat) ? meat : null;

    public static PizzaVariant? ParsePizza(string? value) =>
        Enum.TryParse<PizzaVariant>(value, ignoreCase: false, out var pizza) ? pizza : null;

    public static Sauce ParseSauces(IReadOnlyList<string>? values)
    {
        if (values is null)
            return Sauce.None;

        var combined = Sauce.None;
        foreach (var value in values)
        {
            if (Enum.TryParse<Sauce>(value, ignoreCase: false, out var sauce))
                combined |= sauce;
        }
        return combined;
    }
}
