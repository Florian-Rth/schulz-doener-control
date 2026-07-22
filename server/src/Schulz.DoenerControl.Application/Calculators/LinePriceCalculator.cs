using System.Diagnostics.Contracts;
using Schulz.DoenerControl.Core.Entities;

namespace Schulz.DoenerControl.Application.Calculators;

// Computes the SUGGESTED per-unit line price: the item's base price plus the sum of the selected
// options' price deltas across every field. Pure. The suggestion is what the order form seeds; the
// orderer may override it, and the override is what freezes into OrderLine.PriceCents — so this never
// overrides a user-supplied price, it only proposes one.
public static class LinePriceCalculator
{
    [Pure]
    public static int SuggestedPriceCents(int baseCents, CategorySpec category, LineAnswers answers)
    {
        var delta = 0;
        foreach (var field in category.Fields)
        {
            foreach (var optionKey in answers.OptionsFor(field.Key))
            {
                delta += field.Option(optionKey)?.PriceDeltaCents ?? 0;
            }
        }
        return baseCents + delta;
    }
}
