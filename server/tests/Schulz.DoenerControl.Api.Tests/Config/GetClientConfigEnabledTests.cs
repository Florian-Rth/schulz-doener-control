using System.Net;
using System.Net.Http.Json;
using FastEndpoints.Testing;
using Schulz.DoenerControl.Api.Tests.Auth;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Config;

// With Auth:PwaGateEnabled configured true, /api/config must report the install gate as active so
// the SPA enforces PWA-only access. Uses a dedicated fixture because the flag is bound once at host
// startup; the default-disabled case lives in GetClientConfigTests against the standard harness.
public sealed class GetClientConfigEnabledTests : TestBase<PwaGateEnabledApp>
{
    private const string LoginUrl = "/api/auth/login";
    private const string ConfigUrl = "/api/config";

    private readonly PwaGateEnabledApp app;

    public GetClientConfigEnabledTests(PwaGateEnabledApp app)
    {
        this.app = app;
    }

    [Fact]
    public async Task Should_Return_Gate_Enabled_When_Configured()
    {
        var auth = await LoginAsChefAsync();

        var response = await auth.GetAsync(ConfigUrl);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<ClientConfigResponseBody>(
            TestContext.Current.CancellationToken
        );
        Assert.NotNull(body);
        Assert.True(body!.PwaGateEnabled);
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

    private sealed record ClientConfigResponseBody(bool PwaGateEnabled);
}
