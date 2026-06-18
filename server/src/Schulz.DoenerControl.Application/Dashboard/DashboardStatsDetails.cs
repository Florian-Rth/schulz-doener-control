namespace Schulz.DoenerControl.Application.Dashboard;

// The four "Werks-Überwachung" tiles, all derived from Orders + Debts (nothing aggregate is
// stored): lifetime Döner count (all of the caller's orders), this calendar month's spend (summed
// by OccurredOn), the caller's open-payment count, and the consecutive-ISO-week ordering streak.
public sealed record DashboardStatsDetails(
    int TotalLifetimeCount,
    int MonthlySpendCents,
    string MonthlySpendLabel,
    int OpenPaymentsCount,
    int OpenPaymentsTotalCents,
    string OpenPaymentsTotalLabel,
    int StreakWeeks
);
