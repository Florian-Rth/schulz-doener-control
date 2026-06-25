using System.Net;
using System.Net.Http.Json;
using Schulz.DoenerControl.Api.Endpoints.Profile;
using Schulz.DoenerControl.Api.Tests.Admin;
using Schulz.DoenerControl.Api.Tests.Auth;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Profile;

// The user enters their full PayPal LINK; the app parses the handle out of it and stores ONLY the
// handle, then reconstructs the user-facing base link from the handle on every read. So the PUT/GET
// round-trip surfaces a link, the DB holds a bare handle, and an unparseable link is a 400.
public sealed class ProfileTests : DoenerControlTestBase
{
    private const string LoginUrl = "/api/auth/login";
    private const string ProfileUrl = "/api/profile";
    private const string PayPalHandleUrl = "/api/profile/paypal-handle";

    public ProfileTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Persist_Link_When_Put_And_Return_It_On_Get()
    {
        var auth = await LoginAsChefAsync();

        var putResponse = await auth.PutJsonAsync(
            PayPalHandleUrl,
            new { PayPalHandle = "https://paypal.me/MarkusNeu99" }
        );
        var putBody = await putResponse.Content.ReadFromJsonAsync<PutPayPalHandleResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, putResponse.StatusCode);
        Assert.NotNull(putBody);
        Assert.Equal("https://paypal.me/MarkusNeu99", putBody!.PayPalHandle);
        Assert.True(putBody.PayPalHandleSet);

        var getResponse = await auth.GetAsync(ProfileUrl);
        var getBody = await getResponse.Content.ReadFromJsonAsync<GetProfileResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);
        Assert.NotNull(getBody);
        Assert.Equal("https://paypal.me/MarkusNeu99", getBody!.PayPalHandle);
        Assert.True(getBody.PayPalHandleSet);

        // The DB stores only the bare handle parsed out of the submitted link.
        var persisted = await AdminUserTestHelpers.FindUserAsync(App, TestSeeding.ChefUsername);
        Assert.Equal("MarkusNeu99", persisted!.PayPalHandle);
    }

    [Fact]
    public async Task Should_Accept_PayPalCom_Profile_Link_And_Reconstruct_The_Base_Link()
    {
        var auth = await LoginAsChefAsync();

        var putResponse = await auth.PutJsonAsync(
            PayPalHandleUrl,
            new { PayPalHandle = "https://www.paypal.com/paypalme/MarkusW" }
        );
        var putBody = await putResponse.Content.ReadFromJsonAsync<PutPayPalHandleResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, putResponse.StatusCode);
        // The handle is parsed out of the paypal.com link and read back as a reconstructed base link.
        Assert.Equal("https://paypal.me/MarkusW", putBody!.PayPalHandle);
        Assert.True(putBody.PayPalHandleSet);
    }

    [Fact]
    public async Task Should_Reconstruct_The_Base_Link_From_A_Mixed_Case_Host()
    {
        var auth = await LoginAsChefAsync();

        var putResponse = await auth.PutJsonAsync(
            PayPalHandleUrl,
            new { PayPalHandle = "https://PayPal.Me/MarkusW" }
        );
        var putBody = await putResponse.Content.ReadFromJsonAsync<PutPayPalHandleResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, putResponse.StatusCode);
        Assert.Equal("https://paypal.me/MarkusW", putBody!.PayPalHandle);
    }

    [Fact]
    public async Task Should_Return_Display_Fields_On_Get()
    {
        var auth = await LoginAsChefAsync();

        var getResponse = await auth.GetAsync(ProfileUrl);
        var body = await getResponse.Content.ReadFromJsonAsync<GetProfileResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);
        Assert.NotNull(body);
        Assert.Equal("Markus Wagner", body!.DisplayName);
        Assert.Equal("Markus", body.FirstName);
        Assert.Equal("MW", body.Initials);
        Assert.Equal("Admin", body.Role);
    }

    [Fact]
    public async Task Should_Clear_Handle_When_Put_Null()
    {
        var auth = await LoginAsChefAsync();

        var putResponse = await auth.PutJsonAsync(
            PayPalHandleUrl,
            new { PayPalHandle = (string?)null }
        );
        var putBody = await putResponse.Content.ReadFromJsonAsync<PutPayPalHandleResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, putResponse.StatusCode);
        Assert.NotNull(putBody);
        Assert.Null(putBody!.PayPalHandle);
        Assert.False(putBody.PayPalHandleSet);

        var getResponse = await auth.GetAsync(ProfileUrl);
        var getBody = await getResponse.Content.ReadFromJsonAsync<GetProfileResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.NotNull(getBody);
        Assert.Null(getBody!.PayPalHandle);
        Assert.False(getBody.PayPalHandleSet);
    }

    [Fact]
    public async Task Should_Trim_And_Treat_Blank_Handle_As_Cleared()
    {
        var auth = await LoginAsChefAsync();

        var putResponse = await auth.PutJsonAsync(PayPalHandleUrl, new { PayPalHandle = "   " });
        var putBody = await putResponse.Content.ReadFromJsonAsync<PutPayPalHandleResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, putResponse.StatusCode);
        Assert.NotNull(putBody);
        Assert.Null(putBody!.PayPalHandle);
        Assert.False(putBody.PayPalHandleSet);
    }

    [Fact]
    public async Task Should_Reject_When_Value_Is_A_Bare_Handle()
    {
        var auth = await LoginAsChefAsync();

        var response = await auth.PutJsonAsync(PayPalHandleUrl, new { PayPalHandle = "MarkusW" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Should_Reject_When_Url_Is_Not_A_PayPal_Host()
    {
        var auth = await LoginAsChefAsync();

        var response = await auth.PutJsonAsync(
            PayPalHandleUrl,
            new { PayPalHandle = "https://evil.example.com/MarkusW" }
        );

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Should_Reject_When_Url_Is_Not_Https()
    {
        var auth = await LoginAsChefAsync();

        var response = await auth.PutJsonAsync(
            PayPalHandleUrl,
            new { PayPalHandle = "http://paypal.me/MarkusW" }
        );

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Should_Reject_When_Link_Too_Long()
    {
        var auth = await LoginAsChefAsync();

        var tooLong = "https://paypal.me/" + new string('a', 256);
        var response = await auth.PutJsonAsync(PayPalHandleUrl, new { PayPalHandle = tooLong });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Should_Require_Authentication_For_Get()
    {
        var auth = new AuthTestClient(App.CreateClient());

        var response = await auth.GetAsync(ProfileUrl);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Should_Require_Authentication_For_Put()
    {
        var auth = new AuthTestClient(App.CreateClient());

        var response = await auth.PutJsonAsync(PayPalHandleUrl, new { PayPalHandle = "Test" });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
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
}
