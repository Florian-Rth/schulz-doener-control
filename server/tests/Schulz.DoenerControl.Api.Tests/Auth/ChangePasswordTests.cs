using System.Net;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Auth;

// Each test uses a distinct seeded MustChangePassword account (initial password "Schulz-Start!")
// since change-password mutates the shared per-class database; distinct users keep tests disjoint.
public sealed class ChangePasswordTests : DoenerControlTestBase
{
    private const string LoginUrl = "/api/auth/login";
    private const string ChangePasswordUrl = "/api/auth/change-password";
    private const string MeUrl = "/api/auth/me";
    private const string InitialPassword = "Schulz-Start!";

    public ChangePasswordTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Return_Unauthorized_When_Current_Password_Wrong()
    {
        var auth = await LoggedInClientAsync("l.brandt");

        var response = await auth.PostJsonAsync(
            ChangePasswordUrl,
            new { CurrentPassword = "wrong-current-1", NewPassword = "neuesPasswort99" }
        );

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
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

    private async Task<AuthTestClient> LoggedInClientAsync(string username)
    {
        var auth = new AuthTestClient(App.CreateClient());
        await auth.PostJsonAsync(LoginUrl, new { Username = username, Password = InitialPassword });
        return auth;
    }
}
