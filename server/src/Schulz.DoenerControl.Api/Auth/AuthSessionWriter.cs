using System.Security.Cryptography;
using Schulz.DoenerControl.Application.Security;

namespace Schulz.DoenerControl.Api.Auth;

// Writes the three auth cookies for a freshly authenticated session and reissues the CSRF token.
// The dc_xsrf cookie is reissued on login and refresh (and is re-read by /me) so the SPA always has
// a current double-submit token after a silent refresh under SameSite=None. The refresh cookie's
// lifetime tracks the 30-day rotating refresh token.
public sealed class AuthSessionWriter
{
    private static readonly TimeSpan RefreshLifetime = TimeSpan.FromDays(30);

    private readonly AccessTokenIssuer accessTokenIssuer;
    private readonly AuthCookies cookies;
    private readonly TimeProvider timeProvider;

    public AuthSessionWriter(
        AccessTokenIssuer accessTokenIssuer,
        AuthCookies cookies,
        TimeProvider timeProvider
    )
    {
        this.accessTokenIssuer = accessTokenIssuer;
        this.cookies = cookies;
        this.timeProvider = timeProvider;
    }

    public void WriteSession(HttpResponse response, AuthenticatedUserDetails user)
    {
        var access = accessTokenIssuer.Issue(user);
        cookies.WriteAccess(response, access.Jwt, access.ExpiresAt);

        var refreshExpiry = timeProvider.GetUtcNow() + RefreshLifetime;
        cookies.WriteRefresh(response, user.RawRefreshToken, refreshExpiry);

        ReissueXsrf(response);
    }

    public void ReissueXsrf(HttpResponse response)
    {
        var token = CreateXsrfToken();
        var expiry = timeProvider.GetUtcNow() + RefreshLifetime;
        cookies.WriteXsrf(response, token, expiry);
    }

    public void ClearSession(HttpResponse response) => cookies.ClearAll(response);

    private static string CreateXsrfToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(32);
        return Convert.ToHexString(bytes);
    }
}
