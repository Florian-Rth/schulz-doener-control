namespace Schulz.DoenerControl.Application.Game;

// A stored round, plus whether it beat the caller's previous all-time best.
public sealed record GameScoreDetails(
    Guid Id,
    int Score,
    int Hits,
    int Misses,
    Guid? OrderDayId,
    bool IsPersonalBest
);
