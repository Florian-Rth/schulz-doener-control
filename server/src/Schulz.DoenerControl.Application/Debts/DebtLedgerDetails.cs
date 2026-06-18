namespace Schulz.DoenerControl.Application.Debts;

// Aggregate of the caller's open debts on one side of the ledger: count, summed cents, the German
// total label ("11,50 €") and the rows. Used for both "what I owe" (debtor) and "owed to me"
// (creditor) — the rows describe the opposite party in each case.
public sealed record DebtLedgerDetails(
    int OpenCount,
    int TotalCents,
    string TotalLabel,
    IReadOnlyList<DebtSummary> Debts
);
