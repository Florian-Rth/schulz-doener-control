using System.Diagnostics.Contracts;
using System.Globalization;

namespace Schulz.DoenerControl.Application.Calculators;

// Converts between integer cents (the canonical storage form) and the German display string
// (comma decimal, dot thousands, trailing " €" — the mock's eur() helper). Money never lives as a
// decimal in the DB; this is the boundary conversion.
public static class MoneyFormatter
{
    private static readonly CultureInfo German = CultureInfo.GetCultureInfo("de-DE");

    [Pure]
    public static string ToGermanString(int amountCents)
    {
        var euros = amountCents / 100m;
        return string.Create(German, $"{euros:N2} €");
    }

    [Pure]
    public static int? ParseGermanString(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        var cleaned = value.Replace("€", string.Empty, StringComparison.Ordinal).Trim();

        if (!decimal.TryParse(cleaned, NumberStyles.Number, German, out var euros))
        {
            return null;
        }

        return (int)Math.Round(euros * 100m, MidpointRounding.AwayFromZero);
    }
}
