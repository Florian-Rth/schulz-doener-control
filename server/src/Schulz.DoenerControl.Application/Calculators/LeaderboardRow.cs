namespace Schulz.DoenerControl.Application.Calculators;

// One ranked leaderboard line: the colleague, their derived initials, their order count, their
// dense rank (ties share a rank, ranks never skip), whether this is the viewing user (highlighted
// in the UI), and their Abholer quote normalised to "pickups per 10 orders" so colleagues with
// very different order counts stay comparable.
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
