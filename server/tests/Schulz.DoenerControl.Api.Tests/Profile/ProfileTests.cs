using System.Net;
using System.Net.Http.Json;
using Schulz.DoenerControl.Api.Endpoints.Profile;
using Schulz.DoenerControl.Api.Tests.Auth;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Profile;

public sealed class ProfileTests : DoenerControlTestBase
{
    private const string LoginUrl = "/api/auth/login";
    private const string ProfileUrl = "/api/profile";
    private const string PayPalHandleUrl = "/api/profile/paypal-handle";

    public ProfileTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Persist_Handle_When_Put_And_Return_It_On_Get()
    {
        var auth = await LoginAsChefAsync();

        var putResponse = await auth.PutJsonAsync(
            PayPalHandleUrl,
            new { PayPalHandle = "MarkusNeu99" }
        );
        var putBody = await putResponse.Content.ReadFromJsonAsync<PutPayPalHandleResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, putResponse.StatusCode);
        Assert.NotNull(putBody);
        Assert.Equal("MarkusNeu99", putBody!.PayPalHandle);
        Assert.True(putBody.PayPalHandleSet);

        var getResponse = await auth.GetAsync(ProfileUrl);
        var getBody = await getResponse.Content.ReadFromJsonAsync<GetProfileResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, getResponse.StatusCode);
        Assert.NotNull(getBody);
        Assert.Equal("MarkusNeu99", getBody!.PayPalHandle);
        Assert.True(getBody.PayPalHandleSet);
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
    public async Task Should_Reject_When_Handle_Has_Invalid_Characters()
    {
        var auth = await LoginAsChefAsync();

        var response = await auth.PutJsonAsync(
            PayPalHandleUrl,
            new { PayPalHandle = "has space/slash" }
        );

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Should_Reject_When_Handle_Too_Long()
    {
        var auth = await LoginAsChefAsync();

        var response = await auth.PutJsonAsync(
            PayPalHandleUrl,
            new { PayPalHandle = new string('a', 41) }
        );

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
