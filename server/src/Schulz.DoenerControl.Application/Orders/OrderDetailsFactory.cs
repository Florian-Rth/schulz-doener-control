using Schulz.DoenerControl.Application.Calculators;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Application.Orders;

// Builds the OrderDetails projection from an Order header plus the resolved product name. While the
// external single-item contract holds (B7), the projection mirrors the order's SINGLE line: Kind is
// the lower-case vocabulary token the SPA expects ("doener"/"pizza"); Meat/PizzaVariant are the enum
// names; Sauces is rendered in the canonical vocabulary order; PriceCents is the order TOTAL (sum of
// Quantity * per-unit price over the lines). Keeping this in one place means the upsert, get and
// pickup responses all project identically.
public static class OrderDetailsFactory
{
    public static OrderDetails Build(Order order, string productName)
    {
        var line = order.Lines.Single();
        return new OrderDetails(
            order.Id,
            order.OrderDayId,
            line.ProductId,
            OrderLabelBuilder.BuildProductLabel(
                line.Kind,
                productName,
                line.Meat,
                line.PizzaVariant
            ),
            KindToken(line.Kind),
            line.Meat?.ToString(),
            line.PizzaVariant?.ToString(),
            SauceTokens(line.Sauces),
            order.TotalCents,
            MoneyFormatter.ToGermanString(order.TotalCents),
            line.Extra,
            order.IsPickup,
            OrderLabelBuilder.BuildDescription(line.Kind, line.Sauces, line.Extra)
        );
    }

    private static string KindToken(ProductKind kind) =>
        kind == ProductKind.Pizza ? "pizza" : "doener";

    private static IReadOnlyList<string> SauceTokens(Sauce sauces)
    {
        var tokens = new List<string>(3);
        if (sauces.HasFlag(Sauce.Kraeuter))
            tokens.Add(nameof(Sauce.Kraeuter));
        if (sauces.HasFlag(Sauce.Knoblauch))
            tokens.Add(nameof(Sauce.Knoblauch));
        if (sauces.HasFlag(Sauce.Scharf))
            tokens.Add(nameof(Sauce.Scharf));
        return tokens;
    }
}
