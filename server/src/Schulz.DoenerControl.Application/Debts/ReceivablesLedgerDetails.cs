namespace Schulz.DoenerControl.Application.Debts;

// The caller's full creditor-side ledger: open receivables (still owed) and settled ones (already
// paid back), each with its own count + summed cents + German total label ("11,50 €"). Rows are open
// first (newest-created), then settled (newest-settled).
public sealed record ReceivablesLedgerDetails(
    int OpenCount,
    int OpenTotalCents,
    string OpenTotalLabel,
    int SettledCount,
    int SettledTotalCents,
    string SettledTotalLabel,
    IReadOnlyList<ReceivableSummary> Rows
);
