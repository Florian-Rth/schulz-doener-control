namespace Schulz.DoenerControl.Application.Game;

// One leaderboard row: a colleague's best round in the ranked window (competition ranks).
public sealed record GameScoreSummary(
    int Rank,
    Guid UserId,
    string DisplayName,
    string Initials,
    string AvatarColorHex,
    int Score,
    int Hits,
    bool IsCurrentUser
);
