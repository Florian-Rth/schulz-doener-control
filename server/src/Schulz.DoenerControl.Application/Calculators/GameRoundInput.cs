namespace Schulz.DoenerControl.Application.Calculators;

// One stored round with its player, as the GameLeaderboardRanker needs it.
public sealed record GameRoundInput(
    Guid UserId,
    string DisplayName,
    string AvatarColorHex,
    int Score,
    int Hits,
    int Misses,
    DateTimeOffset PlayedAt
);
