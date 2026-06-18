namespace Schulz.DoenerControl.Application.Debts;

// Marks a debt paid. The caller must be the debtor OR the creditor of the debt (else the debt reads
// as NotFound so existence is not leaked).
public sealed record SettleDebtCommand(Guid CallerUserId, Guid DebtId);
