using Schulz.DoenerControl.Application.Orders;

namespace Schulz.DoenerControl.Api.Endpoints.Orders;

// The endpoint-layer projection of a single order, shared by the upsert/get/pickup responses. Mapped
// from the Application OrderDetails so the service type never leaks past the endpoint boundary.
public sealed record OrderDetailsDto(
    Guid Id,
    Guid OrderDayId,
    string ProductId,
    string ProductLabel,
    string Kind,
    string? Meat,
    string? PizzaVariant,
    IReadOnlyList<string> Sauces,
    int PriceCents,
    string PriceLabel,
    string? Extra,
    bool IsPickup,
    string Detail
);

public static class OrderDetailsMapper
{
    public static OrderDetailsDto ToDto(OrderDetails details) =>
        new(
            details.Id,
            details.OrderDayId,
            details.ProductId,
            details.ProductLabel,
            details.Kind,
            details.Meat,
            details.PizzaVariant,
            details.Sauces,
            details.PriceCents,
            details.PriceLabel,
            details.Extra,
            details.IsPickup,
            details.Detail
        );
}
