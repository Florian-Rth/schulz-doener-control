using System.Diagnostics.Contracts;

namespace Schulz.DoenerControl.Application.Calculators;

// The Glücksrad's pure rules: who sits on the wheel for a given round, who is still eligible for a
// re-spin, and the random pick itself.
public static class PickupWheelDraw
{
    // The slices of the wheel as it looked when `spin` turned: everyone who had ordered by then,
    // minus whoever excused themselves in an earlier round. Ordered by join time for stable slices.
    [Pure]
    public static IReadOnlyList<Guid> CandidatesFor(
        IReadOnlyCollection<WheelParticipant> participants,
        IReadOnlyCollection<WheelSpinInput> spins,
        WheelSpinInput spin
    )
    {
        var excusedBefore = spins
            .Where(other => other.Round < spin.Round && other.IsExcused)
            .Select(other => other.ChosenUserId)
            .ToHashSet();

        return participants
            .Where(participant => participant.JoinedAt <= spin.SpunAt)
            .Where(participant => !excusedBefore.Contains(participant.UserId))
            .OrderBy(participant => participant.JoinedAt)
            .Select(participant => participant.UserId)
            .ToList();
    }

    // Everyone who can still be drawn: all current participants minus everyone excused so far.
    [Pure]
    public static IReadOnlyList<Guid> EligibleFor(
        IReadOnlyCollection<WheelParticipant> participants,
        IReadOnlySet<Guid> excusedUserIds
    ) =>
        participants
            .Where(participant => !excusedUserIds.Contains(participant.UserId))
            .OrderBy(participant => participant.JoinedAt)
            .Select(participant => participant.UserId)
            .ToList();

    public static Guid Pick(IReadOnlyList<Guid> pool, Random random) =>
        pool[random.Next(pool.Count)];
}
