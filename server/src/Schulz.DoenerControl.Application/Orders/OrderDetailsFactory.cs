using Schulz.DoenerControl.Application.Calculators;
using Schulz.DoenerControl.Core.Entities;

namespace Schulz.DoenerControl.Application.Orders;

// Builds the OrderDetails projection from an Order header plus the resolved product names (keyed by
// product id, the item's OWN name — the preset→base resolution is a kitchen-sheet-only concern) and
// the category specs per product (keyed by product id, used to render each line's Detail). The
// order is multi-line: each line is projected on its own; the header's PriceCents is the order TOTAL.
// Keeping this in one place means the upsert, get and pickup responses all project identically.
public static class OrderDetailsFactory
{
    public static OrderDetails Build(
        Order order,
        IReadOnlyDictionary<string, string> productNames,
        IReadOnlyDictionary<string, CategorySpec> categoryByProduct
    )
    {
        // Stable display order across all reads (the lines have no sequence column): by product
        // id, then the line id as tie-break, so the upsert/get/result responses agree.
        var lines = order
            .Lines.OrderBy(line => line.ProductId)
            .ThenBy(line => line.Id)
            .Select(line => BuildLine(line, productNames, categoryByProduct))
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
        IReadOnlyDictionary<string, CategorySpec> categoryByProduct
    )
    {
        var productName = productNames.GetValueOrDefault(line.ProductId, line.ProductId);
        var category = categoryByProduct.GetValueOrDefault(line.ProductId);
        var lineTotal = line.Quantity * line.PriceCents;
        return new OrderLineDetails(
            line.ProductId,
            OrderLabelBuilder.BuildProductLabel(productName),
            line.Answers,
            line.PriceCents,
            MoneyFormatter.ToGermanString(line.PriceCents),
            line.Quantity,
            lineTotal,
            MoneyFormatter.ToGermanString(lineTotal),
            OrderLabelBuilder.BuildDescription(category, line.Answers)
        );
    }
}
