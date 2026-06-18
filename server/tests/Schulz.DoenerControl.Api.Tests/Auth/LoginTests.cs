using System.Net;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Auth;

// First failing test for F3 (Auth). Exercises the real login -> cookie -> protected-endpoint flow
// against the real SQLite harness and seeded accounts. m.wagner is the verified seeded user
// (MustChangePassword=false) so it clears the forced-change gate.
//
// Per-account lockout is a process-global singleton (the schema has no lockout columns), so each
// negative test below targets a DISTINCT seeded username — otherwise a failed-login test would lock
// the account the happy-path test relies on. Distinct usernames keep the lockout buckets disjoint.
public sealed class LoginTests : DoenerControlTestBase
{
    private const string VerifiedUsername = "m.wagner";
    private const string VerifiedPassword = "doener-dev-2026";
    private const string LoginUrl = "/api/auth/login";
    private const string MeUrl = "/api/auth/me";

    public LoginTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Set_Auth_Cookies_When_Credentials_Are_Valid()
    {
        var auth = new AuthTestClient(App.CreateClient());

        var response = await auth.PostJsonAsync(
            LoginUrl,
            new { Username = VerifiedUsername, Password = VerifiedPassword }
        );

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True(auth.HasAccessCookie, "expected dc_access cookie");
        Assert.True(auth.HasRefreshCookie, "expected dc_refresh cookie");
        Assert.True(auth.HasXsrfCookie, "expected dc_xsrf cookie");
    }

    [Fact]
    public async Task Should_Reject_Protected_Endpoint_When_No_Cookie_Present()
    {
        var auth = new AuthTestClient(App.CreateClient());

        var response = await auth.GetAsync(MeUrl);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Should_Allow_Protected_Endpoint_When_Cookie_Present()
    {
        var auth = new AuthTestClient(App.CreateClient());
        await auth.PostJsonAsync(
            LoginUrl,
            new { Username = VerifiedUsername, Password = VerifiedPassword }
        );

        var response = await auth.GetAsync(MeUrl);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Should_Return_Unauthorized_When_Password_Is_Wrong()
    {
        var auth = new AuthTestClient(App.CreateClient());

        var response = await auth.PostJsonAsync(
            LoginUrl,
            new { Username = "t.klein", Password = "totally-wrong" }
        );

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.False(auth.HasAccessCookie);
    }

    [Fact]
    public async Task Should_Return_Unauthorized_When_User_Is_Unknown()
    {
        var auth = new AuthTestClient(App.CreateClient());

        var response = await auth.PostJsonAsync(
            LoginUrl,
            new { Username = "ghost.user", Password = "whatever-123" }
        );

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Should_Rate_Limit_When_Failures_Repeat()
    {
        var auth = new AuthTestClient(App.CreateClient());

        HttpStatusCode last = HttpStatusCode.OK;
        for (var attempt = 0; attempt < 12; attempt++)
        {
            var response = await auth.PostJsonAsync(
                LoginUrl,
                new { Username = "rate.limit.probe", Password = "still-wrong" }
            );
            last = response.StatusCode;
            if (last == HttpStatusCode.TooManyRequests)
                break;
        }

        Assert.Equal(HttpStatusCode.TooManyRequests, last);
    }
}
