using System.Net;
using System.Net.Http.Json;
using Schulz.DoenerControl.Api.Endpoints.Auth;
using Schulz.DoenerControl.Api.Endpoints.Profile;
using Schulz.DoenerControl.Api.Tests.Auth;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Profile;

public sealed class PutDisplayNameTests : DoenerControlTestBase
{
    private const string LoginUrl = "/api/auth/login";
    private const string ChangePasswordUrl = "/api/auth/change-password";
    private const string DisplayNameUrl = "/api/profile/display-name";
    private const string MeUrl = "/api/auth/me";

    public PutDisplayNameTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Persist_Display_Name_And_Reflect_It_On_Me()
    {
        var auth = await LoginAsChefAsync();

        var putResponse = await auth.PutJsonAsync(
            DisplayNameUrl,
            new { DisplayName = "Markus Grimm" }
        );
        var putBody = await putResponse.Content.ReadFromJsonAsync<PutDisplayNameResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, putResponse.StatusCode);
        Assert.NotNull(putBody);
        Assert.Equal("Markus Grimm", putBody!.DisplayName);
        Assert.Equal("MG", putBody.Initials);

        var meResponse = await auth.GetAsync(MeUrl);
        var meBody = await meResponse.Content.ReadFromJsonAsync<GetMeResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, meResponse.StatusCode);
        Assert.NotNull(meBody);
        Assert.Equal("Markus Grimm", meBody!.DisplayName);
        Assert.Equal("MG", meBody.Initials);
    }

    [Fact]
    public async Task Should_Reject_When_Name_Is_Empty()
    {
        var auth = await LoginAsChefAsync();

        var response = await auth.PutJsonAsync(DisplayNameUrl, new { DisplayName = "" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Should_Reject_When_Name_Too_Long()
    {
        var auth = await LoginAsChefAsync();

        var response = await auth.PutJsonAsync(
            DisplayNameUrl,
            new { DisplayName = new string('a', 129) }
        );

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Should_Require_Authentication()
    {
        var auth = new AuthTestClient(App.CreateClient());

        var response = await auth.PutJsonAsync(DisplayNameUrl, new { DisplayName = "Test" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Should_Only_Update_The_Caller_Not_Another_User()
    {
        // A colleague renames themselves; another user's name must be untouched. The chef's name is
        // captured first because sibling tests share this class's DB and may have already renamed it.
        var chef = await LoginAsChefAsync();
        var beforeBody = await (
            await chef.GetAsync(MeUrl)
        ).Content.ReadFromJsonAsync<GetMeResponse>(TestContext.Current.CancellationToken);
        Assert.NotNull(beforeBody);
        var chefNameBefore = beforeBody!.DisplayName;

        var colleague = await LoginAsColleagueAsync("s.yilmaz", "kollegePw44");
        var putResponse = await colleague.PutJsonAsync(
            DisplayNameUrl,
            new { DisplayName = "Sara Neu" }
        );
        Assert.Equal(HttpStatusCode.OK, putResponse.StatusCode);

        var meResponse = await chef.GetAsync(MeUrl);
        var meBody = await meResponse.Content.ReadFromJsonAsync<GetMeResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.NotNull(meBody);
        Assert.Equal(chefNameBefore, meBody!.DisplayName);
        Assert.NotEqual("Sara Neu", meBody.DisplayName);
    }

    private async Task<AuthTestClient> LoginAsChefAsync()
    {
        var auth = new AuthTestClient(App.CreateClient());
        await auth.PostJsonAsync(
            LoginUrl,
            new { Username = "m.wagner", Password = "doener-dev-2026" }
        );
        return auth;
    }

    private async Task<AuthTestClient> LoginAsColleagueAsync(string username, string newPassword)
    {
        var first = new AuthTestClient(App.CreateClient());
        await first.PostJsonAsync(
            LoginUrl,
            new { Username = username, Password = "Schulz-Start!" }
        );
        await first.PostJsonAsync(
            ChangePasswordUrl,
            new { CurrentPassword = "Schulz-Start!", NewPassword = newPassword }
        );

        var auth = new AuthTestClient(App.CreateClient());
        await auth.PostJsonAsync(LoginUrl, new { Username = username, Password = newPassword });
        return auth;
    }
}
