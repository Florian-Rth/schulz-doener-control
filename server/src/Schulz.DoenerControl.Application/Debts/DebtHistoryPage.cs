namespace Schulz.DoenerControl.Application.Debts;

// A slice of the caller's settled payments plus whether older ones exist beyond it.
public sealed record DebtHistoryPage(IReadOnlyList<DebtHistorySummary> Payments, bool HasMore);
