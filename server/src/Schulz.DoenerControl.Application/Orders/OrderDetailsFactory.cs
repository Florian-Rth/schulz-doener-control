using Schulz.DoenerControl.Application.Calculators;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Application.Orders;

// Builds the OrderDetails projection from an Order entity plus the resolved product name. Kind is
// the lower-case vocabulary token the SPA expects ("doener"/"pizza"); Meat/PizzaVariant are the enum
// names; Sauces is rendered in the canonical vocabulary order. Keeping this in one place means the
// upsert, get and pickup responses all project identically.
public static class OrderDetailsFactory
{
    public static OrderDetails Build(Order order, string productName) =>
        new(
            order.Id,
            order.OrderDayId,
            order.ProductId,
            OrderLabelBuilder.BuildProductLabel(
                order.Kind,
                productName,
                order.Meat,
                order.PizzaVariant
            ),
            KindToken(order.Kind),
            order.Meat?.ToString(),
            order.PizzaVariant?.ToString(),
            SauceTokens(order.Sauces),
            order.PriceCents,
            MoneyFormatter.ToGermanString(order.PriceCents),
            order.Extra,
            order.IsPickup,
            OrderLabelBuilder.BuildDescription(order.Kind, order.Sauces, order.Extra)
        );

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
