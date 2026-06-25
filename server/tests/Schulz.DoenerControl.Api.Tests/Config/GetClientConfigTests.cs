using System.Net;
using System.Net.Http.Json;
using Schulz.DoenerControl.Api.Tests.Auth;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Config;

// The PWA install gate runs inside the authenticated app shell, so the SPA fetches its on/off state
// from /api/config with the session cookie. The flag is operational kill-switch config: an
// environment that has not configured it must report the gate disabled, so a fresh deployment is
// never accidentally locked to PWA-only.
public sealed class GetClientConfigTests : DoenerControlTestBase
{
    private const string LoginUrl = "/api/auth/login";
    private const string ConfigUrl = "/api/config";

    public GetClientConfigTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Return_Gate_Disabled_When_Not_Configured()
    {
        var auth = await LoginAsChefAsync();

        var response = await auth.GetAsync(ConfigUrl);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ClientConfigResponseBody>(
            TestContext.Current.CancellationToken
        );
        Assert.NotNull(body);
        Assert.False(body!.PwaGateEnabled);
    }

    [Fact]
    public async Task Should_Return_Unauthorized_When_Not_Authenticated()
    {
        var auth = new AuthTestClient(App.CreateClient());

        var response = await auth.GetAsync(ConfigUrl);

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

    private sealed record ClientConfigResponseBody(bool PwaGateEnabled);
}
