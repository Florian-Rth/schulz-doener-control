using Schulz.DoenerControl.Application.Calculators;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Application.Orders;

// Builds the OrderDetails projection from an Order header plus the resolved product names (keyed by
// product id) and the resolved pizza-variant names (keyed by variant id). The order is multi-line:
// each line is projected on its own (Kind is the lower-case vocabulary token the SPA expects,
// "doener"/"pizza"; Meat is the enum name; PizzaVariant is the variant id STRING the SPA submitted
// — the variant Name is resolved only for the label; Sauces is in canonical order; PriceCents is the
// per-unit price). The header's PriceCents is the order TOTAL. Keeping this in one place means the
// upsert, get and pickup responses all project identically.
public static class OrderDetailsFactory
{
    public static OrderDetails Build(
        Order order,
        IReadOnlyDictionary<string, string> productNames,
        IReadOnlyDictionary<Guid, string> pizzaVariantNames
    )
    {
        // Stable display order across all reads (the lines have no sequence column): by product
        // id, then the line id as tie-break, so the upsert/get/result responses agree.
        var lines = order
            .Lines.OrderBy(line => line.ProductId)
            .ThenBy(line => line.Id)
            .Select(line => BuildLine(line, productNames, pizzaVariantNames))
            .ToList();
        return new OrderDetails(
            order.Id,
            order.OrderDayId,
            lines,
            order.TotalCents,
            MoneyFormatter.ToGermanString(order.TotalCents),
            order.IsPickup
        );
    }

    private static OrderLineDetails BuildLine(
        OrderLine line,
        IReadOnlyDictionary<string, string> productNames,
        IReadOnlyDictionary<Guid, string> pizzaVariantNames
    )
    {
        var productName = productNames.GetValueOrDefault(line.ProductId, line.ProductId);
        var variantName = ResolveVariantName(line.PizzaVariantId, pizzaVariantNames);
        var lineTotal = line.Quantity * line.PriceCents;
        return new OrderLineDetails(
            line.ProductId,
            OrderLabelBuilder.BuildProductLabel(line.Kind, productName, line.Meat, variantName),
            KindToken(line.Kind),
            line.Meat?.ToString(),
            line.PizzaVariantId?.ToString(),
            SauceTokens(line.Sauces),
            line.PriceCents,
            MoneyFormatter.ToGermanString(line.PriceCents),
            line.Extra,
            line.Quantity,
            lineTotal,
            MoneyFormatter.ToGermanString(lineTotal),
            OrderLabelBuilder.BuildDescription(line.Kind, line.Sauces, line.Extra)
        );
    }

    private static string? ResolveVariantName(
        Guid? pizzaVariantId,
        IReadOnlyDictionary<Guid, string> pizzaVariantNames
    ) => pizzaVariantId is { } id ? pizzaVariantNames.GetValueOrDefault(id) : null;

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
