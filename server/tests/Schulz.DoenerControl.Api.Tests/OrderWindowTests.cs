using Schulz.DoenerControl.Application.Calculators;
using Schulz.DoenerControl.Core.Enums;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests;

// The Bestellschluss / edit-window rule as a pure predicate. There is no time cutoff: ordering is
// allowed only while the day is Open AND ordering has not been manually locked (OrderingClosedAt is
// null). A closed day or a set OrderingClosedAt both reject, regardless of the clock.
public sealed class OrderWindowTests
{
    private static readonly DateTimeOffset Instant = new(2026, 6, 18, 11, 30, 0, TimeSpan.Zero);

    [Fact]
    public void Should_AllowOrder_When_OpenAndOrderingNotClosed()
    {
        Assert.True(OrderWindow.CanOrder(OrderDayStatus.Open, null));
    }

    [Fact]
    public void Should_RejectOrder_When_OpenButOrderingClosed()
    {
        Assert.False(OrderWindow.CanOrder(OrderDayStatus.Open, Instant));
    }

    [Fact]
    public void Should_RejectOrder_When_DayClosedAndOrderingNotClosed()
    {
        Assert.False(OrderWindow.CanOrder(OrderDayStatus.Closed, null));
    }

    [Fact]
    public void Should_RejectOrder_When_DayClosedAndOrderingClosed()
    {
        Assert.False(OrderWindow.CanOrder(OrderDayStatus.Closed, Instant));
    }
}
