using System.Diagnostics.Contracts;

namespace Schulz.DoenerControl.Application.Calculators;

// Plausibility bounds of a Döner-Weitwurf round. The score is client-reported, so the server only
// rejects what the game cannot produce: a 30 s round allows one throw every ~0.3 s, the meat strip
// is the most valuable piece and the combo multiplier is capped. Mirrors web/src/features/game.
public static class GameScoreRules
{
    public const int MaxThrowsPerRound = 120;
    public const int MaxPointsPerPiece = 30;
    public const int MaxComboMultiplier = 3;

    [Pure]
    public static int MaxScoreFor(int hits) => hits * MaxPointsPerPiece * MaxComboMultiplier;

    [Pure]
    public static bool IsPlausible(int score, int hits, int misses) =>
        hits >= 0
        && misses >= 0
        && hits + misses <= MaxThrowsPerRound
        && score >= 0
        && score <= MaxScoreFor(hits);
}
