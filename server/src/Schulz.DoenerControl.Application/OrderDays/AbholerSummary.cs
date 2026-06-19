namespace Schulz.DoenerControl.Application.OrderDays;

// The designated Abholer (collector) as the day projection exposes them, resolved strictly from
// OrderDay.CollectorUserId. PayPalUrl is built per-CALLER for the FEATURE 3 reimbursement deep link:
// it carries the caller's own order total and is null when the caller is the collector, the caller
// has not ordered, or the collector has no PayPal handle.
public sealed record AbholerSummary(
    string Name,
    string Initials,
    string ColorHex,
    string? PayPalUrl
);
