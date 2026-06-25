using System.Diagnostics.Contracts;

namespace Schulz.DoenerControl.Application.Calculators;

// Storage-side helper: turns the user-entered PayPal LINK into the bare handle we persist. A blank or
// unparseable value clears the setting (null). Validation already rejects an unparseable non-empty
// link before it reaches the service, so the null-on-unparseable branch is a defensive fallback.
public static class PayPalHandleParsing
{
    [Pure]
    public static string? FromLink(string? link) =>
        PayPalLinkParser.TryParseHandle(link, out var handle) ? handle : null;
}
