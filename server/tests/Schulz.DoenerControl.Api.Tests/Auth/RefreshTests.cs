using System.Net;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Auth;

// Exercises the refresh-token rotation + reuse-detection security behaviour against the real DB.
public sealed class RefreshTests : DoenerControlTestBase
{
    private const string LoginUrl = "/api/auth/login";
    private const string RefreshUrl = "/api/auth/refresh";
    private const string MeUrl = "/api/auth/me";

    public RefreshTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Rotate_Refresh_Token_When_Valid()
    {
        var auth = await LoggedInClientAsync();
        var oldRefresh = auth.Cookies["dc_refresh"];

        var response = await auth.PostAsync(RefreshUrl);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True(auth.HasAccessCookie);
        Assert.NotEqual(oldRefresh, auth.Cookies["dc_refresh"]);
    }

    [Fact]
    public async Task Should_Issue_Usable_Access_Cookie_When_Refreshed()
    {
        var auth = await LoggedInClientAsync();
        await auth.PostAsync(RefreshUrl);

        var response = await auth.GetAsync(MeUrl);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Should_Revoke_Family_When_Old_Token_Is_Reused()
    {
        var auth = await LoggedInClientAsync();
        var stolenRefresh = auth.Cookies["dc_refresh"];

        // Legitimate rotation consumes the original token and issues a replacement.
        await auth.PostAsync(RefreshUrl);
        var rotatedRefresh = auth.Cookies["dc_refresh"];

        // Replay the now-revoked original token: reuse detection must reject it...
        auth.OverrideCookie("dc_refresh", stolenRefresh);
        var replay = await auth.PostAsync(RefreshUrl);
        Assert.Equal(HttpStatusCode.Unauthorized, replay.StatusCode);

        // ...and revoke the whole family, so even the previously-valid rotated token is now dead.
        auth.OverrideCookie("dc_refresh", rotatedRefresh);
        var afterFamilyRevoke = await auth.PostAsync(RefreshUrl);
        Assert.Equal(HttpStatusCode.Unauthorized, afterFamilyRevoke.StatusCode);
    }

    [Fact]
    public async Task Should_Return_Unauthorized_When_No_Refresh_Cookie()
    {
        var auth = new AuthTestClient(App.CreateClient());

        var response = await auth.PostAsync(RefreshUrl);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Should_Return_Unauthorized_When_Refresh_Token_Is_Unknown()
    {
        var auth = new AuthTestClient(App.CreateClient());
        auth.OverrideCookie("dc_refresh", "not-a-real-token");

        var response = await auth.PostAsync(RefreshUrl);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
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
