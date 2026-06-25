using System.Diagnostics.Contracts;
using System.Globalization;

namespace Schulz.DoenerControl.Application.Calculators;

// Builds the PayPal.Me deep link from a stored handle. The user only ever sees/enters a link; the
// handle is an internal detail parsed out on the way in (PayPalLinkParser) and reconstructed back to
// a link here on the way out. The base form is paypal.me/{handle}; supplying an amount (integer
// cents) appends the original amount suffix paypal.me/{handle}/{amount}EUR — two decimals with a dot
// separator regardless of server culture. Returns null when the recipient has no handle so the UI
// can disable the button.
public static class PayPalLinkBuilder
{
    [Pure]
    public static string FormatAmount(int amountCents)
    {
        var euros = amountCents / 100m;
        return euros.ToString("0.00", CultureInfo.InvariantCulture);
    }

    [Pure]
    public static string? BuildLink(string? handle, int? amountCents)
    {
        if (string.IsNullOrWhiteSpace(handle))
            return null;

        var trimmed = handle.Trim();
        return amountCents is { } cents
            ? $"https://paypal.me/{trimmed}/{FormatAmount(cents)}EUR"
            : $"https://paypal.me/{trimmed}";
    }
}
