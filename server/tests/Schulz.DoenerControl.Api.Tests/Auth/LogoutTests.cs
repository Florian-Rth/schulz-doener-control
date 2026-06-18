using System.Net;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Auth;

public sealed class LogoutTests : DoenerControlTestBase
{
    private const string LoginUrl = "/api/auth/login";
    private const string LogoutUrl = "/api/auth/logout";
    private const string RefreshUrl = "/api/auth/refresh";

    public LogoutTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Clear_Cookies_When_Logged_Out()
    {
        var auth = await LoggedInClientAsync();

        var response = await auth.PostAsync(LogoutUrl);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        Assert.False(auth.HasAccessCookie);
        Assert.False(auth.HasRefreshCookie);
        Assert.False(auth.HasXsrfCookie);
    }

    [Fact]
    public async Task Should_Revoke_Refresh_When_Logged_Out()
    {
        var auth = await LoggedInClientAsync();
        var refreshToken = auth.Cookies["dc_refresh"];

        await auth.PostAsync(LogoutUrl);

        // The refresh token the client held before logout is now revoked server-side.
        auth.OverrideCookie("dc_refresh", refreshToken);
        var refresh = await auth.PostAsync(RefreshUrl);
        Assert.Equal(HttpStatusCode.Unauthorized, refresh.StatusCode);
    }

    [Fact]
    public async Task Should_Reject_Logout_When_Csrf_Token_Missing()
    {
        var auth = await LoggedInClientAsync();
        auth.SuppressXsrfHeader = true;

        var response = await auth.PostAsync(LogoutUrl);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    private async Task<AuthTestClient> LoggedInClientAsync()
    {
        var auth = new AuthTestClient(App.CreateClient());
        await auth.PostJsonAsync(
            LoginUrl,
            new { Username = "m.wagner", Password = "doener-dev-2026" }
        );
        return auth;
    }
}
