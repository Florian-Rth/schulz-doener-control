using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Application.Dashboard;

public interface IDashboardService
{
    // Composes the caller's stats, Döner-Tier, the current-year leaderboard and their open debts.
    Task<Result<DashboardDetails>> GetAsync(Guid callerId, CancellationToken ct);
}
