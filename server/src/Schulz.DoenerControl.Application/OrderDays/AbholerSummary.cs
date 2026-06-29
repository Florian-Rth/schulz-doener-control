namespace Schulz.DoenerControl.Application.OrderDays;

// The designated Abholer (collector) as the day projection exposes them, resolved strictly from
// OrderDay.CollectorUserId. PayPalUrl is always null on the live day: reimbursement happens only
// through the debts created at close-day, once the Abholer is final — never via an open-day deep
// link that could target a pickup person who is still about to change. The field is retained
// (nullable) to keep the projection shape stable across the SPA boundary.
public sealed record AbholerSummary(
    string Name,
    string Initials,
    string ColorHex,
    string? PayPalUrl
);
