using System.Collections.ObjectModel;
using System.Diagnostics.Contracts;

namespace Schulz.DoenerControl.Application.Calculators;

// Ranks the per-year order tallies into the Döner-Bestenliste: count-descending, DENSE ranking
// (ties share a rank, the next distinct count is the very next rank — ranks never skip, so
// 1,2,2,3 not 1,2,2,4), the current user flagged, and the gap to the next-higher count surfaced
// for the "nur noch X bis Platz N" line.
public static class LeaderboardCalculator
{
    [Pure]
    public static Leaderboard Rank(IReadOnlyList<LeaderboardEntryInput> entries, Guid currentUserId)
    {
        var ordered = entries.OrderByDescending(e => e.Count).ToArray();
        var rankByCount = DenseRankByCount(ordered);

        var rows = ordered
            .Select(entry => new LeaderboardRow(
                entry.UserId,
                entry.DisplayName,
                NameFormatter.InitialsOf(entry.DisplayName),
                entry.Count,
                rankByCount[entry.Count],
                entry.UserId == currentUserId
            ))
            .ToList();

        var (nextRankDiff, nextRank) = ComputeNextRank(ordered, rankByCount, currentUserId);

        return new Leaderboard(
            new ReadOnlyCollection<LeaderboardRow>(rows),
            nextRankDiff,
            nextRank
        );
    }

    // Maps each distinct count to its dense rank: the highest count is rank 1, the next distinct
    // (lower) count rank 2, and so on — regardless of how many people tie at any given count.
    [Pure]
    private static IReadOnlyDictionary<int, int> DenseRankByCount(
        IReadOnlyList<LeaderboardEntryInput> ordered
    ) =>
        ordered
            .Select(entry => entry.Count)
            .Distinct()
            .Select((count, index) => (count, rank: index + 1))
            .ToDictionary(pair => pair.count, pair => pair.rank);

    [Pure]
    private static (int? Diff, int? Rank) ComputeNextRank(
        IReadOnlyList<LeaderboardEntryInput> ordered,
        IReadOnlyDictionary<int, int> rankByCount,
        Guid currentUserId
    )
    {
        var current = ordered.FirstOrDefault(e => e.UserId == currentUserId);
        if (current is null)
            return (null, null);

        var higherCounts = ordered.Where(e => e.Count > current.Count).Select(e => e.Count);
        if (!higherCounts.Any())
            return (null, null);

        var nextCount = higherCounts.Min();

        return (nextCount - current.Count, rankByCount[nextCount]);
    }
}
