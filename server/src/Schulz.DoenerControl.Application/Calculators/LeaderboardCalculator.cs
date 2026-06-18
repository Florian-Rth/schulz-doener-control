using System.Collections.ObjectModel;
using System.Diagnostics.Contracts;

namespace Schulz.DoenerControl.Application.Calculators;

// Ranks the per-year order tallies into the Döner-Bestenliste: count-descending, standard
// competition ranking (ties share a rank, the next distinct count skips ranks), the current user
// flagged, and the gap to the next-higher count surfaced for the "nur noch X bis Platz N" line.
public static class LeaderboardCalculator
{
    [Pure]
    public static Leaderboard Rank(IReadOnlyList<LeaderboardEntryInput> entries, Guid currentUserId)
    {
        var ordered = entries.OrderByDescending(e => e.Count).ToArray();

        var rows = new List<LeaderboardRow>(ordered.Length);
        foreach (var entry in ordered)
        {
            var rank = 1 + ordered.Count(other => other.Count > entry.Count);
            rows.Add(
                new LeaderboardRow(
                    entry.UserId,
                    entry.DisplayName,
                    NameFormatter.InitialsOf(entry.DisplayName),
                    entry.Count,
                    rank,
                    entry.UserId == currentUserId
                )
            );
        }

        var (nextRankDiff, nextRank) = ComputeNextRank(ordered, currentUserId);

        return new Leaderboard(
            new ReadOnlyCollection<LeaderboardRow>(rows),
            nextRankDiff,
            nextRank
        );
    }

    [Pure]
    private static (int? Diff, int? Rank) ComputeNextRank(
        IReadOnlyList<LeaderboardEntryInput> ordered,
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
        var nextRank = 1 + ordered.Count(e => e.Count > nextCount);

        return (nextCount - current.Count, nextRank);
    }
}
