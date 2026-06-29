namespace Schulz.DoenerControl.Application.Debts;

// One row in the Abholer's creditor-side ledger ("Was mir noch zusteht"): a debt where the caller is
// the creditor. DebtorName/Initials/AvatarColorHex describe the colleague who owes the caller.
// IsSettled reflects the debtor's self-attested settle; SettledAt is null while still open. DayLabel
// is the human weekday hint, null for ad-hoc debts (no order day). No PayPal link: this view is
// read-only — paying back stays the debtor's action on their own "Offene Zahlungen" list.
public sealed record ReceivableSummary(
    Guid Id,
    string DebtorName,
    string Initials,
    string AvatarColorHex,
    string Reason,
    string? DayLabel,
    int AmountCents,
    string AmountLabel,
    bool IsSettled,
    DateTimeOffset? SettledAt,
    DateTimeOffset CreatedAt
);
