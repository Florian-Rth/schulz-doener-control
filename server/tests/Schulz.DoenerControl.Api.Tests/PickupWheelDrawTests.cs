using Schulz.DoenerControl.Application.Calculators;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests;

public sealed class PickupWheelDrawTests
{
    private static readonly DateTimeOffset Noon = new(2026, 1, 15, 12, 0, 0, TimeSpan.Zero);
    private static readonly Guid Anna = Guid.NewGuid();
    private static readonly Guid Ben = Guid.NewGuid();
    private static readonly Guid Cem = Guid.NewGuid();

    [Fact]
    public void Should_LeaveOutLateJoiners_When_ResolvingARoundsCandidates()
    {
        var participants = new[]
        {
            new WheelParticipant(Anna, Noon.AddMinutes(-30)),
            new WheelParticipant(Ben, Noon.AddMinutes(5)),
        };
        var spin = new WheelSpinInput(1, Anna, Noon, IsExcused: false);

        var candidates = PickupWheelDraw.CandidatesFor(participants, [spin], spin);

        Assert.Equal([Anna], candidates);
    }

    [Fact]
    public void Should_LeaveOutEarlierExcuses_When_ResolvingARoundsCandidates()
    {
        var participants = new[]
        {
            new WheelParticipant(Anna, Noon.AddMinutes(-30)),
            new WheelParticipant(Ben, Noon.AddMinutes(-20)),
            new WheelParticipant(Cem, Noon.AddMinutes(-10)),
        };
        var first = new WheelSpinInput(1, Anna, Noon, IsExcused: true);
        var second = new WheelSpinInput(2, Ben, Noon.AddMinutes(2), IsExcused: false);

        var candidates = PickupWheelDraw.CandidatesFor(participants, [first, second], second);

        Assert.Equal([Ben, Cem], candidates);
    }

    [Fact]
    public void Should_ExcludeExcusedPeople_When_ResolvingTheEligiblePool()
    {
        var participants = new[]
        {
            new WheelParticipant(Anna, Noon),
            new WheelParticipant(Ben, Noon.AddMinutes(1)),
        };

        var pool = PickupWheelDraw.EligibleFor(participants, new HashSet<Guid> { Anna });

        Assert.Equal([Ben], pool);
    }
}
