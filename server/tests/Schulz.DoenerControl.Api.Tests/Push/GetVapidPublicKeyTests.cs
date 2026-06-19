using System.Net;
using System.Net.Http.Json;
using FastEndpoints.Testing;
using Schulz.DoenerControl.Api.Tests.Auth;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Push;

// The web-push subscribe flow fetches the server's VAPID public key (the browser's
// applicationServerKey) before creating a subscription. The key is the configured test value the
// PushTestApp injects; the endpoint is authenticated like the other push endpoints, so the SPA
// calls it with its session cookie.
public sealed class GetVapidPublicKeyTests : TestBase<PushTestApp>
{
    private const string LoginUrl = "/api/auth/login";
    private const string VapidPublicKeyUrl = "/api/push/vapid-public-key";

    private readonly PushTestApp app;

    public GetVapidPublicKeyTests(PushTestApp app)
    {
        this.app = app;
    }

    [Fact]
    public async Task Should_Return_Configured_Vapid_Public_Key_When_Authenticated()
    {
        var auth = await LoginAsChefAsync();

        var response = await auth.GetAsync(VapidPublicKeyUrl);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<VapidPublicKeyResponseBody>(
            TestContext.Current.CancellationToken
        );
        Assert.NotNull(body);
        Assert.Equal(TestConfig.VapidPublicKey, body!.PublicKey);
    }

    [Fact]
    public async Task Should_Return_Unauthorized_When_Not_Authenticated()
    {
        var auth = new AuthTestClient(app.CreateClient());

        var response = await auth.GetAsync(VapidPublicKeyUrl);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    private async Task<AuthTestClient> LoginAsChefAsync()
    {
        var auth = new AuthTestClient(app.CreateClient());
        await auth.PostJsonAsync(
            LoginUrl,
            new { Username = "m.wagner", Password = "doener-dev-2026" }
        );
        return auth;
    }

    private sealed record VapidPublicKeyResponseBody(string PublicKey);
}
