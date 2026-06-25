using System.Diagnostics.Contracts;
using System.Text.RegularExpressions;

namespace Schulz.DoenerControl.Application.Calculators;

// Parses the user's full PayPal LINK down to the bare handle we store internally. The user only ever
// enters a link (e.g. https://paypal.me/MarkusW); we read the handle out of it and persist that, then
// reconstruct links from the handle via PayPalLinkBuilder. Accepts the two real PayPal link shapes:
//   paypal.me/{handle}              (host paypal.me / www.paypal.me — handle is the first segment)
//   paypal.com/paypalme/{handle}    (host paypal.com / www.paypal.com — handle follows "paypalme")
// Only https is accepted; query and fragment are ignored and a trailing slash is stripped. The
// extracted handle must match ^[A-Za-z0-9]{1,40}$, so a bare handle, an http link, a non-PayPal
// host, a profile link without a handle (e.g. /myaccount/profile), or an invalid handle all fail.
public static partial class PayPalLinkParser
{
    private const string PayPalMeHost = "paypal.me";
    private const string PayPalMeWwwHost = "www.paypal.me";
    private const string PayPalComHost = "paypal.com";
    private const string PayPalComWwwHost = "www.paypal.com";
    private const string PayPalMePathPrefix = "paypalme";

    [GeneratedRegex("^[A-Za-z0-9]{1,40}$")]
    private static partial Regex HandlePattern();

    [Pure]
    public static bool TryParseHandle(string? link, out string handle)
    {
        handle = string.Empty;

        if (string.IsNullOrWhiteSpace(link))
            return false;

        if (!Uri.TryCreate(link.Trim(), UriKind.Absolute, out var uri))
            return false;

        if (uri.Scheme != Uri.UriSchemeHttps)
            return false;

        var candidate = ExtractHandle(uri);
        if (candidate is null || !HandlePattern().IsMatch(candidate))
            return false;

        handle = candidate;
        return true;
    }

    [Pure]
    private static string? ExtractHandle(Uri uri)
    {
        var segments = uri.AbsolutePath.Split('/', StringSplitOptions.RemoveEmptyEntries);

        return uri.Host.ToLowerInvariant() switch
        {
            PayPalMeHost or PayPalMeWwwHost => segments.Length >= 1 ? segments[0] : null,
            PayPalComHost or PayPalComWwwHost => HandleFromPayPalComPath(segments),
            _ => null,
        };
    }

    [Pure]
    private static string? HandleFromPayPalComPath(string[] segments) =>
        segments.Length >= 2
        && string.Equals(segments[0], PayPalMePathPrefix, StringComparison.OrdinalIgnoreCase)
            ? segments[1]
            : null;
}
