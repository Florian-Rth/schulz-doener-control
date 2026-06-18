using System.Collections.ObjectModel;

namespace Schulz.DoenerControl.Application.Calculators;

// The fully ranked board plus the "nur noch X bis Platz N" hint for the current user:
// NextRankDiff is the gap to the next-higher distinct count and NextRank is that count's rank.
// Both are null when the current user already leads (or has no row).
public sealed record Leaderboard(
    ReadOnlyCollection<LeaderboardRow> Rows,
    int? NextRankDiff,
    int? NextRank
);
