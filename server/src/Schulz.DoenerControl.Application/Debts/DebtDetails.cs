namespace Schulz.DoenerControl.Application.Debts;

// The single-debt projection returned by settle and ad-hoc create. Status is the enum name
// ("Open"/"Settled"/"Cancelled"); SettledAt is set once the debt is marked paid.
public sealed record DebtDetails(
    Guid Id,
    string Status,
    DateTimeOffset? SettledAt,
    int AmountCents,
    string Reason
);
