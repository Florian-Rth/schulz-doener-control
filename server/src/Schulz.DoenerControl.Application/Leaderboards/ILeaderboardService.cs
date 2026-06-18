using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Application.Leaderboards;

public interface ILeaderboardService
{
    // Ranks every active user's orders in the requested year, flags the caller and computes their
    // gap to the next-higher rank. Always succeeds (an empty year just yields no entries).
    Task<Result<LeaderboardDetails>> GetForYearAsync(
        GetLeaderboardQuery query,
        CancellationToken ct
    );
}
