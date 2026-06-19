namespace Schulz.DoenerControl.Application.Debts;

// One row in the caller's "Meine letzten Zahlungen" history: a debt the caller (debtor) has already
// settled. PersonName/Initials/AvatarColorHex describe the CREDITOR — the colleague the caller paid.
// SettledAt is the instant the caller marked it paid (history is newest-first by this).
public sealed record DebtHistorySummary(
    string PersonName,
    string Initials,
    string AvatarColorHex,
    int AmountCents,
    string AmountLabel,
    DateTimeOffset SettledAt,
    string Reason
);
