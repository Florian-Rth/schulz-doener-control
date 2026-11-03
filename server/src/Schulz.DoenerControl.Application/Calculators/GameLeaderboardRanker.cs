using System.Diagnostics.Contracts;
using Schulz.DoenerControl.Application.Game;

namespace Schulz.DoenerControl.Application.Calculators;

// Turns raw rounds into a Weitwurf-Bestenliste: each colleague's best round (ties broken by fewer
// misses, then the earlier round), sorted by score with competition ranks, cut to `take` rows.
public static class GameLeaderboardRanker
{
    [Pure]
    public static IReadOnlyList<GameScoreSummary> Rank(
        IEnumerable<GameRoundInput> rounds,
        Guid callerId,
        int take
    )
    {
        var bests = rounds
            .GroupBy(round => round.UserId)
            .Select(BestOf)
            .OrderByDescending(round => round.Score)
            .ThenBy(round => round.Misses)
            .ThenBy(round => round.PlayedAt)
            .Take(take)
            .ToList();

        return bests
            .Select((round, index) => ToSummary(round, RankAt(bests, index), callerId))
            .ToList();
    }

    [Pure]
    private static GameRoundInput BestOf(IEnumerable<GameRoundInput> rounds) =>
        rounds
            .OrderByDescending(round => round.Score)
            .ThenBy(round => round.Misses)
            .ThenBy(round => round.PlayedAt)
            .First();

    [Pure]
    private static int RankAt(IReadOnlyList<GameRoundInput> sorted, int index)
    {
        var score = sorted[index].Score;
        var firstWithScore = index;
        while (firstWithScore > 0 && sorted[firstWithScore - 1].Score == score)
            firstWithScore--;
        return firstWithScore + 1;
    }

    [Pure]
    private static GameScoreSummary ToSummary(GameRoundInput round, int rank, Guid callerId) =>
        new(
            rank,
            round.UserId,
            round.DisplayName,
            NameFormatter.InitialsOf(round.DisplayName),
            round.AvatarColorHex,
            round.Score,
            round.Hits,
            round.UserId == callerId
        );
}
