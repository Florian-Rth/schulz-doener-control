namespace Schulz.DoenerControl.Api.Auth;

// Cookie names + writers for the three auth cookies. Under a separate-origin deployment the auth
// cookies must be SameSite=None + Secure so the SPA on app.* can send them to api.*; the CSRF
// double-submit token (the non-httpOnly dc_xsrf) is what guards against forgery once SameSite is
// relaxed. Secure is gated off only in non-HTTPS local dev so the dev SPA still works.
public sealed class AuthCookies
{
    public const string AccessCookie = "dc_access";
    public const string RefreshCookie = "dc_refresh";
    public const string XsrfCookie = "dc_xsrf";

    public const string RefreshCookiePath = "/api/auth";

    private const string RootPath = "/";

    private readonly bool secure;

    public AuthCookies(bool secure)
    {
        this.secure = secure;
    }

    public void WriteAccess(HttpResponse response, string jwt, DateTimeOffset expiresAt) =>
        Append(response, AccessCookie, jwt, RootPath, httpOnly: true, expiresAt);

    public void WriteRefresh(HttpResponse response, string rawToken, DateTimeOffset expiresAt) =>
        Append(response, RefreshCookie, rawToken, RefreshCookiePath, httpOnly: true, expiresAt);

    public string WriteXsrf(HttpResponse response, string token, DateTimeOffset expiresAt)
    {
        Append(response, XsrfCookie, token, RootPath, httpOnly: false, expiresAt);
        return token;
    }

    public void ClearAll(HttpResponse response)
    {
        Expire(response, AccessCookie, RootPath, httpOnly: true);
        Expire(response, RefreshCookie, RefreshCookiePath, httpOnly: true);
        Expire(response, XsrfCookie, RootPath, httpOnly: false);
    }

    private void Append(
        HttpResponse response,
        string name,
        string value,
        string path,
        bool httpOnly,
        DateTimeOffset expiresAt
    ) => response.Cookies.Append(name, value, BuildOptions(path, httpOnly, expiresAt));

    private void Expire(HttpResponse response, string name, string path, bool httpOnly) =>
        response.Cookies.Append(
            name,
            string.Empty,
            BuildOptions(path, httpOnly, DateTimeOffset.UnixEpoch)
        );

    private CookieOptions BuildOptions(string path, bool httpOnly, DateTimeOffset expiresAt) =>
        new()
        {
            HttpOnly = httpOnly,
            Secure = secure,
            // Separate-origin prod needs SameSite=None (cross-site) which browsers only honour with
            // Secure. Local dev runs over plain http where None-without-Secure is rejected, so fall
            // back to Lax there (same-origin via the dev proxy); CSRF still guards mutations.
            SameSite = secure ? SameSiteMode.None : SameSiteMode.Lax,
            Path = path,
            Expires = expiresAt,
            IsEssential = true,
        };
}
