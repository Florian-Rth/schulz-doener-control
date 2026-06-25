using System.Net;
using System.Net.Http.Json;
using Schulz.DoenerControl.Api.Tests.Auth;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Config;

// /api/config is the non-secret client config the SPA reads. It is anonymous: the pre-login
// register/login page must read registrationMode to react to the self-registration policy, so the
// endpoint must answer without a session. The PWA-gate flag is operational kill-switch config: an
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
    public async Task Should_Return_Config_Anonymously_When_Not_Authenticated()
    {
        var auth = new AuthTestClient(App.CreateClient());

        var response = await auth.GetAsync(ConfigUrl);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ClientConfigResponseBody>(
            TestContext.Current.CancellationToken
        );
        Assert.NotNull(body);
        // The seeded default registration policy is Enabled (mode 1), surfaced even without a session
        // so the pre-login register page can react to it.
        Assert.Equal(1, body!.RegistrationMode);
        Assert.False(body.PwaGateEnabled);
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

    private sealed record ClientConfigResponseBody(bool PwaGateEnabled, int RegistrationMode);
}
