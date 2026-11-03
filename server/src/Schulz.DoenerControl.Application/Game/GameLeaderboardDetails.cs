namespace Schulz.DoenerControl.Application.Game;

// The Weitwurf-Bestenliste: the best rounds of today's Döner-Tag (empty without one) and the
// all-time top, one row per colleague each.
public sealed record GameLeaderboardDetails(
    IReadOnlyList<GameScoreSummary> Today,
    IReadOnlyList<GameScoreSummary> AllTime
);
