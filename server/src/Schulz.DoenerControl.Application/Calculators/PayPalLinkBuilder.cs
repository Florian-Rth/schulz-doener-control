using System.Diagnostics.Contracts;
using System.Globalization;

namespace Schulz.DoenerControl.Application.Calculators;

// Builds the PayPal.Me deep link from integer cents. The amount is always two decimals with a dot
// separator regardless of server culture (PLAN correction #13): paypal.me/{handle}/{amount}EUR.
// Returns null when the recipient has not supplied a handle so the UI can disable the button.
public static class PayPalLinkBuilder
{
    [Pure]
    public static string FormatAmount(int amountCents)
    {
        var euros = amountCents / 100m;
        return euros.ToString("0.00", CultureInfo.InvariantCulture);
    }

    [Pure]
    public static string? BuildLink(string? handle, int amountCents)
    {
        if (string.IsNullOrWhiteSpace(handle))
            return null;

        return $"https://paypal.me/{handle.Trim()}/{FormatAmount(amountCents)}EUR";
    }
}
