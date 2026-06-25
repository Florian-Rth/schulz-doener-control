namespace Schulz.DoenerControl.Application.Leaderboards;

// One ranked Bestenliste row: the colleague, their derived initials and stored avatar colour, their
// year order count, their competition rank, whether this is the viewing user (highlighted), and the
// emoji of their assigned Döner-Tier over the rolling 90-day window (null when not computed).
public sealed record LeaderboardEntryDetails(
    int Rank,
    Guid UserId,
    string DisplayName,
    string Initials,
    string AvatarColorHex,
    int Count,
    bool IsCurrentUser,
    string? TierEmoji
);
