using FastEndpoints;

namespace Schulz.DoenerControl.Api.Auth;

// Double-submit CSRF guard. On every state-changing (non-GET) authenticated request the client must
// echo the non-httpOnly dc_xsrf cookie back in the X-XSRF-TOKEN header; this compares the two and
// rejects a mismatch with 403. Safe (read-only) verbs are exempt; anonymous endpoints never get
// this processor attached. This is the forgery defense that holds even with SameSite=None cookies
// under a separate-origin deployment.
public sealed class CsrfPreProcessor : IGlobalPreProcessor
{
    private const string XsrfHeaderName = "X-XSRF-TOKEN";

    public async Task PreProcessAsync(IPreProcessorContext ctx, CancellationToken ct)
    {
        var http = ctx.HttpContext;

        if (IsSafe(http.Request.Method))
            return;

        var cookieToken = http.Request.Cookies[AuthCookies.XsrfCookie];
        var headerToken = http.Request.Headers[XsrfHeaderName].ToString();

        if (TokensMatch(cookieToken, headerToken))
            return;

        if (!http.ResponseStarted())
            await http.Response.SendForbiddenAsync(ct);
    }

    private static bool IsSafe(string method) =>
        HttpMethods.IsGet(method)
        || HttpMethods.IsHead(method)
        || HttpMethods.IsOptions(method)
        || HttpMethods.IsTrace(method);

    private static bool TokensMatch(string? cookieToken, string headerToken) =>
        !string.IsNullOrEmpty(cookieToken)
        && !string.IsNullOrEmpty(headerToken)
        && string.Equals(cookieToken, headerToken, StringComparison.Ordinal);
}
