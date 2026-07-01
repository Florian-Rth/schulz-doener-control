using Schulz.DoenerControl.Application.Calculators;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests;

// Pure-logic unit tests for reconciling the day's single designated collector with a participant's
// pickup state: claiming pickup makes the participant THE collector unconditionally (a take-over
// that displaces any prior collector — one unified "ich hole ab" rule); releasing pickup vacates the
// designation only if the releaser was the collector.
public sealed class CollectorDesignationTests
{
    private static readonly Guid Participant = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid OtherCollector = Guid.Parse(
        "22222222-2222-2222-2222-222222222222"
    );

    [Fact]
    public void Should_Designate_Participant_When_Pickup_And_No_Collector()
    {
        var result = CollectorDesignation.Reconcile(null, Participant, isPickup: true);

        Assert.Equal(Participant, result);
    }

    [Fact]
    public void Should_Take_Over_When_Pickup_And_Different_Collector()
    {
        var result = CollectorDesignation.Reconcile(OtherCollector, Participant, isPickup: true);

        // Claiming pickup is a take-over: the participant becomes the collector, displacing the prior.
        Assert.Equal(Participant, result);
    }

    [Fact]
    public void Should_Keep_Self_When_Pickup_And_Already_Collector()
    {
        var result = CollectorDesignation.Reconcile(Participant, Participant, isPickup: true);

        Assert.Equal(Participant, result);
    }

    [Fact]
    public void Should_Vacate_When_Release_And_Self_Is_Collector()
    {
        var result = CollectorDesignation.Reconcile(Participant, Participant, isPickup: false);

        Assert.Null(result);
    }

    [Fact]
    public void Should_Keep_Collector_When_Release_And_Different_Collector()
    {
        var result = CollectorDesignation.Reconcile(OtherCollector, Participant, isPickup: false);

        Assert.Equal(OtherCollector, result);
    }
}
