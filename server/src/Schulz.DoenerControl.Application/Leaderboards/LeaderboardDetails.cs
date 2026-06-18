namespace Schulz.DoenerControl.Application.Leaderboards;

// The fully ranked per-year Döner-Bestenliste. Entries are count-descending with competition ranks
// and the caller flagged. DoenerToNextRank / NextRank carry the "nur noch X bis Platz N" hint — the
// gap to the next-higher distinct count and that count's rank; both null when the caller already
// leads (or has no row this year).
public sealed record LeaderboardDetails(
    int Year,
    IReadOnlyList<LeaderboardEntryDetails> Entries,
    int? DoenerToNextRank,
    int? NextRank
);
