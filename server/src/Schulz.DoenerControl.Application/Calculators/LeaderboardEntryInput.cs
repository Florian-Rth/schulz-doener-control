namespace Schulz.DoenerControl.Application.Calculators;

// A per-user order tally for a given year, projected from a GROUP BY over Orders without leaking
// the User entity across the service boundary. PickupCount is how many of those orders were the
// Abholer's own (the person who fetched the bag that day).
public sealed record LeaderboardEntryInput(
    Guid UserId,
    string DisplayName,
    int Count,
    int PickupCount
);
