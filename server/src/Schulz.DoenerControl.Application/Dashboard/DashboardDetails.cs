using Schulz.DoenerControl.Application.Calculators;
using Schulz.DoenerControl.Application.Debts;

namespace Schulz.DoenerControl.Application.Dashboard;

// The composed home screen in one round-trip (PLAN aggregate #8): the stats tiles, the caller's
// derived Döner-Tier, the per-year leaderboard with the caller flagged, and the caller's open
// debts. The granular endpoints stay for reuse; this just spares the mobile client the fan-out.
public sealed record DashboardDetails(
    DashboardStatsDetails Stats,
    DoenerTier Tier,
    Leaderboard Leaderboard,
    DebtLedgerDetails OpenDebts
);
