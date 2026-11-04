namespace Schulz.DoenerControl.Application.Debts;

// One page of the caller's "Meine letzten Zahlungen" history (caller = debtor), newest-settled
// first. Skip/Take page through it so the card can grow on demand instead of shipping everything.
public sealed record GetPaymentHistoryQuery(Guid CallerUserId, int Skip, int Take);
