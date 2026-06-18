using System.Diagnostics.Contracts;
using System.Globalization;

namespace Schulz.DoenerControl.Application.Calculators;

// Computes the ordering streak: the number of consecutive ISO weeks, ending at the reference
// week, in which the user participated at least once. The streak is zero unless the reference
// week itself contains an order, then it walks backward until the first missed week.
public static class StreakCalculator
{
    [Pure]
    public static int ComputeStreak(IReadOnlyList<DateOnly> orderDates, DateOnly reference)
    {
        if (orderDates.Count == 0)
            return 0;

        var participatedWeeks = orderDates.Select(IsoWeekIndex).ToHashSet();

        var week = IsoWeekIndex(reference);
        var streak = 0;
        while (participatedWeeks.Contains(week))
        {
            streak++;
            week--;
        }

        return streak;
    }

    // A monotonic week ordinal that increases by one per ISO week and is contiguous across calendar
    // year boundaries (so the last ISO week of one year and the first of the next are adjacent).
    [Pure]
    private static int IsoWeekIndex(DateOnly date)
    {
        var asDate = date.ToDateTime(TimeOnly.MinValue);
        var monday = ISOWeek.ToDateTime(
            ISOWeek.GetYear(asDate),
            ISOWeek.GetWeekOfYear(asDate),
            DayOfWeek.Monday
        );

        return (int)((monday - DateTime.UnixEpoch).TotalDays / 7);
    }
}
