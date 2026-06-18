using Schulz.DoenerControl.Application.Calculators;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests;

public sealed class DebtDayLabelBuilderTests
{
    private static readonly DateOnly Today = new(2026, 6, 18); // a Thursday

    [Fact]
    public void Should_ReturnHeute_When_SameDay()
    {
        Assert.Equal("heute", DebtDayLabelBuilder.Build(Today, Today));
    }

    [Fact]
    public void Should_ReturnWeekday_When_WithinTheLastSixDays()
    {
        // Two days before the Thursday "today" is a Tuesday.
        var tuesday = new DateOnly(2026, 6, 16);
        Assert.Equal("Dienstag", DebtDayLabelBuilder.Build(tuesday, Today));
    }

    [Fact]
    public void Should_ReturnLetzteWoche_When_SevenToThirteenDaysAgo()
    {
        var lastWeek = Today.AddDays(-7);
        Assert.Equal("letzte Woche", DebtDayLabelBuilder.Build(lastWeek, Today));
    }

    [Fact]
    public void Should_ReturnGermanDate_When_OlderThanTwoWeeks()
    {
        var old = new DateOnly(2026, 5, 1);
        Assert.Equal("01.05.2026", DebtDayLabelBuilder.Build(old, Today));
    }
}
