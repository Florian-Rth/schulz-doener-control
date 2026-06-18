namespace Schulz.DoenerControl.Application.Calculators;

// One ranked leaderboard line: the colleague, their derived initials, their order count, their
// competition rank, and whether this is the viewing user (highlighted in the UI).
public sealed record LeaderboardRow(
    Guid UserId,
    string DisplayName,
    string Initials,
    int Count,
    int Rank,
    bool IsCurrentUser
);
