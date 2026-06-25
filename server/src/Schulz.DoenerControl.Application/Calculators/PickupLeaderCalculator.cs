using System.Collections.ObjectModel;
using System.Diagnostics.Contracts;

namespace Schulz.DoenerControl.Application.Calculators;

// Picks the Packesel winner(s) from per-user pickup tallies over the rolling 90-day window: the
// user(s) with the most pickups, but only when that maximum reaches the qualifying threshold. A tie
// at the top hands the award to every user sharing the max — there can be several Packesel. This is
// a global superlative across users, distinct from the per-user order-pattern tiers.
public static class PickupLeaderCalculator
{
    // A user must have collected at least this many Döner-Tage to qualify as a Packesel at all — a
    // single lucky pickup does not earn the title.
    public const int MinPickupsToQualify = 2;

    private static readonly ReadOnlyCollection<Guid> Empty = new(Array.Empty<Guid>());

    [Pure]
    public static ReadOnlyCollection<Guid> WinningUserIds(
        IReadOnlyDictionary<Guid, int> pickupCounts
    )
    {
        if (pickupCounts.Count == 0)
            return Empty;

        var max = pickupCounts.Values.Max();
        if (max < MinPickupsToQualify)
            return Empty;

        var winners = pickupCounts
            .Where(pair => pair.Value == max)
            .Select(pair => pair.Key)
            .ToList();

        return new ReadOnlyCollection<Guid>(winners);
    }
}
