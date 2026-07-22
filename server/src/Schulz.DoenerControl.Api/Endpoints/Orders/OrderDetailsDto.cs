using Schulz.DoenerControl.Application.Orders;

namespace Schulz.DoenerControl.Api.Endpoints.Orders;

// The endpoint-layer projection of a single order, shared by the upsert/get/pickup responses. The
// order is multi-line: Lines carries each item; PriceCents is the order total. Answers is the
// field→answer map so the edit form can re-seed itself. Mapped from the Application OrderDetails so
// the service type never leaks past the endpoint boundary.
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
    IReadOnlyDictionary<string, AnswerFieldDto> Answers,
    int PriceCents,
    string PriceLabel,
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
            AnswersWire.ToDto(line.Answers),
            line.PriceCents,
            line.PriceLabel,
            line.Quantity,
            line.LineTotalCents,
            line.LineTotalLabel,
            line.Detail
        );
}
