namespace Schulz.DoenerControl.Application.Calculators;

// One ranked leaderboard line: the colleague, their derived initials, their order count, their
// dense rank (ties share a rank, ranks never skip), whether this is the viewing user (highlighted
// in the UI), and their Abholscore: pickups per 10 of their OWN orders. The base is deliberately
// only the days they ordered (a pickup is a flag on the Abholer's own order), since you only have
// to fetch when you are part of the round — that keeps colleagues with different order counts fair.
public sealed record LeaderboardRow(
    Guid UserId,
    string DisplayName,
    string Initials,
    int Count,
    int Rank,
    bool IsCurrentUser,
    int PickupCount,
    decimal PickupsPerTenOrders
);
