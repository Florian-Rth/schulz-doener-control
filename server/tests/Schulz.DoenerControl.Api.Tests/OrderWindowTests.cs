using Schulz.DoenerControl.Application.Calculators;
using Schulz.DoenerControl.Core.Enums;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests;

// The Bestellschluss / edit-window rule as a pure predicate. The exact boundary matters: at the
// cutoff instant ordering is still allowed; one tick past it is rejected; a closed day is always
// rejected regardless of the clock.
public sealed class OrderWindowTests
{
    private static readonly DateTimeOffset Cutoff = new(2026, 6, 18, 11, 30, 0, TimeSpan.Zero);

    [Fact]
    public void Should_AllowOrder_When_OpenAndBeforeCutoff()
    {
        Assert.True(OrderWindow.CanOrder(OrderDayStatus.Open, Cutoff, Cutoff.AddMinutes(-1)));
    }

    [Fact]
    public void Should_AllowOrder_When_OpenAndExactlyAtCutoff()
    {
        Assert.True(OrderWindow.CanOrder(OrderDayStatus.Open, Cutoff, Cutoff));
    }

    [Fact]
    public void Should_RejectOrder_When_OneTickPastCutoff()
    {
        Assert.False(OrderWindow.CanOrder(OrderDayStatus.Open, Cutoff, Cutoff.AddTicks(1)));
    }

    [Fact]
    public void Should_RejectOrder_When_DayClosed()
    {
        Assert.False(OrderWindow.CanOrder(OrderDayStatus.Closed, Cutoff, Cutoff.AddMinutes(-1)));
    }
}
