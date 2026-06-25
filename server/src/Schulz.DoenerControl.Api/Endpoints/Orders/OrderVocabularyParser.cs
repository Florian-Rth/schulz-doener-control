using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Api.Endpoints.Orders;

// Parses the request's order-vocabulary strings (the canonical enum names Kalb/Haehnchen,
// Kraeuter/Knoblauch/Scharf, and the pizza variant id) into the command's primitives. The pizza
// variant is now an admin-managed catalog id, so ParsePizza only shapes the string into a Guid?; the
// order service validates the id against the available catalog (an unknown id rejects the upsert).
// The validator is the authority on which combinations are legal; this only maps recognised tokens
// and folds the sauce list into the bit-flags enum.
public static class OrderVocabularyParser
{
    public static MeatType? ParseMeat(string? value) =>
        Enum.TryParse<MeatType>(value, ignoreCase: false, out var meat) ? meat : null;

    public static Guid? ParsePizza(string? value) =>
        Guid.TryParse(value, out var variantId) ? variantId : null;

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
