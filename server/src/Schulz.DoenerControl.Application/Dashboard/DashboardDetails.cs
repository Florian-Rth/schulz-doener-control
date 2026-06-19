using Schulz.DoenerControl.Application.Calculators;
using Schulz.DoenerControl.Application.Debts;
using Schulz.DoenerControl.Application.Leaderboards;
using Schulz.DoenerControl.Application.OrderDays;
using Schulz.DoenerControl.Application.Users;

namespace Schulz.DoenerControl.Application.Dashboard;

// The composed home screen in one round-trip (PLAN aggregate #8): the greeting identity, the stats
// tiles, the caller's derived Döner-Tier, the per-year leaderboard, today's Döner-Tag (null when no
// day exists), and the caller's open debts. The granular endpoints stay for reuse; this just spares
// the mobile client the fan-out. The endpoint shapes these to the frontend DashboardSchema.
public sealed record DashboardDetails(
    CurrentUserDetails Caller,
    DashboardStatsDetails Stats,
    DoenerTier Tier,
    LeaderboardDetails Leaderboard,
    OrderDayDetails? Today,
    DebtLedgerDetails OpenDebts,
    string? Toast
);
