using Schulz.DoenerControl.Application.OrderDays;

namespace Schulz.DoenerControl.Api.Endpoints.OrderDays;

// The endpoint-layer projection of a Döner-Tag, shared by the today/open/close/by-id responses
// (all return the same shape per the API plan). Mapped from the Application OrderDayDetails so the
// service type never leaks past the endpoint boundary.
public sealed record OrderDayDetailsDto(
    Guid Id,
    DateOnly Date,
    string Status,
    string Synonym,
    string PushText,
    DateTimeOffset OrderCutoffAt,
    string CutoffLabel,
    bool IsPastCutoff,
    int ParticipantCount,
    IReadOnlyList<string> PickupNames,
    IReadOnlyList<OrderRowSummaryDto> Orders,
    bool ICanStillOrder,
    Guid? MyOrderId
);

public sealed record OrderRowSummaryDto(
    Guid OrderId,
    string PersonName,
    string Initials,
    string AvatarColorHex,
    string ProductLabel,
    string Description,
    int PriceCents,
    string PriceLabel,
    bool IsMine,
    bool IsPickup
);

public static class OrderDayDetailsMapper
{
    public static OrderDayDetailsDto ToDto(OrderDayDetails details) =>
        new(
            details.Id,
            details.Date,
            details.Status,
            details.Synonym,
            details.PushText,
            details.OrderCutoffAt,
            details.CutoffLabel,
            details.IsPastCutoff,
            details.ParticipantCount,
            details.PickupNames,
            details.Orders.Select(ToRowDto).ToList(),
            details.ICanStillOrder,
            details.MyOrderId
        );

    private static OrderRowSummaryDto ToRowDto(OrderRowSummary row) =>
        new(
            row.OrderId,
            row.PersonName,
            row.Initials,
            row.AvatarColorHex,
            row.ProductLabel,
            row.Description,
            row.PriceCents,
            row.PriceLabel,
            row.IsMine,
            row.IsPickup
        );
}
