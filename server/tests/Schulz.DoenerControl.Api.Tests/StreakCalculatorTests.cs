using Schulz.DoenerControl.Application.Calculators;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests;

// Pure-logic unit tests for the ordering streak: consecutive ISO weeks ending at the reference
// week in which the user participated at least once.
public sealed class StreakCalculatorTests
{
    private static DateOnly Day(int year, int month, int day) => new(year, month, day);

    [Fact]
    public void Should_Count_Consecutive_Weeks_When_Unbroken_Run()
    {
        // Reference Thu 2026-06-18; three consecutive Thursdays back.
        var dates = new[] { Day(2026, 6, 18), Day(2026, 6, 11), Day(2026, 6, 4) };

        var streak = StreakCalculator.ComputeStreak(dates, Day(2026, 6, 18));

        Assert.Equal(3, streak);
    }

    [Fact]
    public void Should_Stop_At_First_Gap()
    {
        // Has current week and previous week, then a missing week, then more — only 2 count.
        var dates = new[] { Day(2026, 6, 18), Day(2026, 6, 11), Day(2026, 5, 28) };

        var streak = StreakCalculator.ComputeStreak(dates, Day(2026, 6, 18));

        Assert.Equal(2, streak);
    }

    [Fact]
    public void Should_Be_Zero_When_Reference_Week_Has_No_Order()
    {
        // Participated last week but not this week => streak no longer "ends this week".
        var dates = new[] { Day(2026, 6, 11), Day(2026, 6, 4) };

        var streak = StreakCalculator.ComputeStreak(dates, Day(2026, 6, 18));

        Assert.Equal(0, streak);
    }

    [Fact]
    public void Should_Count_One_When_Only_Reference_Week()
    {
        var dates = new[] { Day(2026, 6, 16) };

        var streak = StreakCalculator.ComputeStreak(dates, Day(2026, 6, 18));

        Assert.Equal(1, streak);
    }

    [Fact]
    public void Should_Collapse_Multiple_Orders_In_Same_Week()
    {
        // Two orders in the same ISO week count as one week of the streak.
        var dates = new[] { Day(2026, 6, 18), Day(2026, 6, 16), Day(2026, 6, 11) };

        var streak = StreakCalculator.ComputeStreak(dates, Day(2026, 6, 18));

        Assert.Equal(2, streak);
    }

    [Fact]
    public void Should_Be_Zero_When_No_Orders()
    {
        var streak = StreakCalculator.ComputeStreak(Array.Empty<DateOnly>(), Day(2026, 6, 18));

        Assert.Equal(0, streak);
    }

    [Fact]
    public void Should_Span_Year_Boundary_Using_Iso_Weeks()
    {
        // ISO weeks cross the calendar year: 2025-12-30 (Tue) and 2026-01-06 are adjacent ISO weeks.
        var dates = new[] { Day(2026, 1, 6), Day(2025, 12, 30), Day(2025, 12, 23) };

        var streak = StreakCalculator.ComputeStreak(dates, Day(2026, 1, 6));

        Assert.Equal(3, streak);
    }
}
