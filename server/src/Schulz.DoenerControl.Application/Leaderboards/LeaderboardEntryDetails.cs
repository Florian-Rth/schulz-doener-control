namespace Schulz.DoenerControl.Application.Leaderboards;

// One ranked Bestenliste row: the colleague, their derived initials and stored avatar colour, their
// year order count, their competition rank, and whether this is the viewing user (highlighted).
public sealed record LeaderboardEntryDetails(
    int Rank,
    Guid UserId,
    string DisplayName,
    string Initials,
    string AvatarColorHex,
    int Count,
    bool IsCurrentUser
);
