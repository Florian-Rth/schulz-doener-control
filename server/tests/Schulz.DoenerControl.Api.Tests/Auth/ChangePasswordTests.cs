using System.Net;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Auth;

// Each test uses a distinct account since change-password mutates the shared per-class database;
// distinct users keep tests disjoint. Forced accounts (initial password "Schulz-Start!") cover the
// first-login path; self-service tests seed dedicated MustChangePassword=false users.
public sealed class ChangePasswordTests : DoenerControlTestBase
{
    private const string LoginUrl = "/api/auth/login";
    private const string ChangePasswordUrl = "/api/auth/change-password";
    private const string MeUrl = "/api/auth/me";
    private const string InitialPassword = "Schulz-Start!";

    public ChangePasswordTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Reject_Wrong_CurrentPassword_When_Not_Forced()
    {
        const string username = "self.wrongpw";
        const string password = "selbst-passwort-1";
        await App.Services.SeedUserAsync(
            username,
            "Selbst Falsch",
            password,
            mustChangePassword: false,
            ct: TestContext.Current.CancellationToken
        );
        var auth = await LoggedInClientAsync(username, password);

        var response = await auth.PostJsonAsync(
            ChangePasswordUrl,
            new { CurrentPassword = "wrong-current-1", NewPassword = "neuesPasswort99" }
        );

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Should_Require_CurrentPassword_When_Not_Forced()
    {
        const string username = "self.requirepw";
        const string password = "selbst-passwort-2";
        await App.Services.SeedUserAsync(
            username,
            "Selbst Pflicht",
            password,
            mustChangePassword: false,
            ct: TestContext.Current.CancellationToken
        );
        var auth = await LoggedInClientAsync(username, password);

        var response = await auth.PostJsonAsync(
            ChangePasswordUrl,
            new { NewPassword = "neuesPasswort99" }
        );

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Should_Change_Without_CurrentPassword_When_MustChangePassword_Set()
    {
        const string username = "t.klein";
        const string newPassword = "ohneAltesPw5";
        var auth = await LoggedInClientAsync(username);

        var response = await auth.PostJsonAsync(
            ChangePasswordUrl,
            new { NewPassword = newPassword }
        );
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        // The forced flag must have cleared: the new password logs in and reaches a gated endpoint.
        var fresh = new AuthTestClient(App.CreateClient());
        await fresh.PostJsonAsync(LoginUrl, new { Username = username, Password = newPassword });
        var me = await fresh.GetAsync(MeUrl);
        Assert.Equal(HttpStatusCode.OK, me.StatusCode);
    }

    [Fact]
    public async Task Should_Block_Other_Endpoints_While_Must_Change_Password()
    {
        var auth = await LoggedInClientAsync("s.yilmaz");

        var response = await auth.GetAsync(MeUrl);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Should_Allow_Login_With_New_Password_And_Reject_Old_After_Change()
    {
        const string username = "a.schaefer";
        const string newPassword = "ganzNeuesPw7";
        var auth = await LoggedInClientAsync(username);

        var change = await auth.PostJsonAsync(
            ChangePasswordUrl,
            new { CurrentPassword = InitialPassword, NewPassword = newPassword }
        );
        Assert.Equal(HttpStatusCode.NoContent, change.StatusCode);

        var withNew = new AuthTestClient(App.CreateClient());
        var loginNew = await withNew.PostJsonAsync(
            LoginUrl,
            new { Username = username, Password = newPassword }
        );
        Assert.Equal(HttpStatusCode.OK, loginNew.StatusCode);

        var withOld = new AuthTestClient(App.CreateClient());
        var loginOld = await withOld.PostJsonAsync(
            LoginUrl,
            new { Username = username, Password = InitialPassword }
        );
        Assert.Equal(HttpStatusCode.Unauthorized, loginOld.StatusCode);
    }

    [Fact]
    public async Task Should_Clear_Must_Change_Flag_After_Successful_Change()
    {
        const string username = "j.hoffmann";
        const string newPassword = "frischesPw42";
        var auth = await LoggedInClientAsync(username);

        await auth.PostJsonAsync(
            ChangePasswordUrl,
            new { CurrentPassword = InitialPassword, NewPassword = newPassword }
        );

        // Re-login with the new password; the gate must now permit a protected endpoint.
        var fresh = new AuthTestClient(App.CreateClient());
        await fresh.PostJsonAsync(LoginUrl, new { Username = username, Password = newPassword });
        var me = await fresh.GetAsync(MeUrl);
        Assert.Equal(HttpStatusCode.OK, me.StatusCode);
    }

    private async Task<AuthTestClient> LoggedInClientAsync(
        string username,
        string password = InitialPassword
    )
    {
        var auth = new AuthTestClient(App.CreateClient());
        await auth.PostJsonAsync(LoginUrl, new { Username = username, Password = password });
        return auth;
    }
}
