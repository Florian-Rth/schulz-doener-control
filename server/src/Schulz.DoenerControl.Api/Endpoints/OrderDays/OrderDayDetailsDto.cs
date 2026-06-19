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
    bool IsOrderingClosed,
    Guid? MyOrderId,
    bool AmICollector,
    AbholerDto? Abholer
);

// The designated Abholer (collector) for the day. PayPalUrl is the per-caller reimbursement deep
// link (FEATURE 3), null when no link should be offered to this caller.
public sealed record AbholerDto(string Name, string Initials, string ColorHex, string? PayPalUrl);

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
            details.IsOrderingClosed,
            details.MyOrderId,
            details.AmICollector,
            details.Abholer is { } abholer ? ToAbholerDto(abholer) : null
        );

    private static AbholerDto ToAbholerDto(AbholerSummary abholer) =>
        new(abholer.Name, abholer.Initials, abholer.ColorHex, abholer.PayPalUrl);

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
