using System.Diagnostics.Contracts;

namespace Schulz.DoenerControl.Application.Calculators;

// Turns an order day's calendar date (relative to "today") into the short human hint the debt
// ledger shows next to the reason ("Döner-Tag · letzte Woche"). Culture-fixed German output so the
// label never drifts with the server locale; null is the caller's responsibility (ad-hoc debts).
public static class DebtDayLabelBuilder
{
    private static readonly string[] GermanWeekdays =
    [
        "Sonntag",
        "Montag",
        "Dienstag",
        "Mittwoch",
        "Donnerstag",
        "Freitag",
        "Samstag",
    ];

    [Pure]
    public static string Build(DateOnly dayDate, DateOnly today)
    {
        var daysAgo = today.DayNumber - dayDate.DayNumber;

        return daysAgo switch
        {
            0 => "heute",
            >= 1 and <= 6 => GermanWeekdays[(int)dayDate.DayOfWeek],
            >= 7 and <= 13 => "letzte Woche",
            _ => dayDate.ToString("dd.MM.yyyy"),
        };
    }
}
