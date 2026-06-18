namespace Schulz.DoenerControl.Application.Debts;

// One row in a debt ledger. PersonName/Initials/AvatarColorHex describe the OTHER party (the
// creditor on the "what I owe" list, the debtor on the "owed to me" list). PaypalUrl is the
// server-built paypal.me deep link, null when that party has no handle so the UI disables the
// button. DayLabel is the human "letzte Woche"/weekday hint, null for ad-hoc debts.
public sealed record DebtSummary(
    Guid Id,
    string PersonName,
    string Initials,
    string AvatarColorHex,
    string Reason,
    string? DayLabel,
    int AmountCents,
    string AmountLabel,
    string? PaypalUrl,
    DateTimeOffset CreatedAt
);
