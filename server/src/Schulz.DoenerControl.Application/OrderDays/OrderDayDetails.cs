namespace Schulz.DoenerControl.Application.OrderDays;

// The full Döner-Tag projection the dashboard, deep-link, open and close flows all return.
// PushText is the rendered open-day sentence; CutoffLabel is the German "11:30 Uhr" form. The
// caller-relative flags (ICanStillOrder, MyOrderId) are resolved against the requesting user.
public sealed record OrderDayDetails(
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
    IReadOnlyList<OrderRowSummary> Orders,
    bool ICanStillOrder,
    bool IsOrderingClosed,
    Guid? MyOrderId
);
