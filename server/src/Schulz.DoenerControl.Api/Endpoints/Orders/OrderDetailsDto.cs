using Schulz.DoenerControl.Application.Orders;

namespace Schulz.DoenerControl.Api.Endpoints.Orders;

// The endpoint-layer projection of a single order, shared by the upsert/get/pickup responses. The
// order is multi-line: Lines carries each item; PriceCents is the order total. Mapped from the
// Application OrderDetails so the service type never leaks past the endpoint boundary.
public sealed record OrderDetailsDto(
    Guid Id,
    Guid OrderDayId,
    IReadOnlyList<OrderLineDto> Lines,
    int PriceCents,
    string PriceLabel,
    bool IsPickup
);

public sealed record OrderLineDto(
    string ProductId,
    string ProductLabel,
    string Kind,
    string? Meat,
    string? PizzaVariant,
    IReadOnlyList<string> Sauces,
    int PriceCents,
    string PriceLabel,
    string? Extra,
    int Quantity,
    int LineTotalCents,
    string LineTotalLabel,
    string Detail
);

public static class OrderDetailsMapper
{
    public static OrderDetailsDto ToDto(OrderDetails details) =>
        new(
            details.Id,
            details.OrderDayId,
            details.Lines.Select(ToLineDto).ToList(),
            details.PriceCents,
            details.PriceLabel,
            details.IsPickup
        );

    private static OrderLineDto ToLineDto(OrderLineDetails line) =>
        new(
            line.ProductId,
            line.ProductLabel,
            line.Kind,
            line.Meat,
            line.PizzaVariant,
            line.Sauces,
            line.PriceCents,
            line.PriceLabel,
            line.Extra,
            line.Quantity,
            line.LineTotalCents,
            line.LineTotalLabel,
            line.Detail
        );
}
