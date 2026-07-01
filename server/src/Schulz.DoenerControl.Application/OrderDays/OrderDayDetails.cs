namespace Schulz.DoenerControl.Application.OrderDays;

// The full Döner-Tag projection the dashboard, deep-link, open and close flows all return.
// PushText is the rendered open-day sentence; CutoffLabel is the bare "HH:mm" moment ordering was
// closed, and null while ordering is still open. The caller-relative flags (ICanStillOrder,
// MyOrderId) are resolved against the requesting user.
public sealed record OrderDayDetails(
    Guid Id,
    DateOnly Date,
    string Status,
    string Synonym,
    string PushText,
    string? CutoffLabel,
    int ParticipantCount,
    IReadOnlyList<string> PickupNames,
    IReadOnlyList<OrderRowSummary> Orders,
    OrderPrintList PrintList,
    bool ICanStillOrder,
    bool IsOrderingClosed,
    Guid? MyOrderId,
    bool AmICollector,
    AbholerSummary? Abholer
);
