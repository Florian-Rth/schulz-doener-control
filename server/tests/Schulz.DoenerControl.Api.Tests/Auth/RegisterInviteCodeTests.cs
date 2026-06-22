using System.Net;
using System.Net.Http.Json;
using FastEndpoints.Testing;
using Schulz.DoenerControl.Api.Endpoints.Auth;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Auth;

// Self-registration with the invite-code gate active (Auth:RegistrationInviteCode configured). A
// correct code registers (201); a wrong or missing code is rejected (403). The open-registration
// path (no code configured) is covered by RegisterTests against the default harness.
public sealed class RegisterInviteCodeTests : TestBase<RegisterInviteCodeApp>
{
    private const string RegisterUrl = "/api/auth/register";

    private readonly RegisterInviteCodeApp app;

    public RegisterInviteCodeTests(RegisterInviteCodeApp app)
    {
        this.app = app;
    }

    [Fact]
    public async Task Should_Register_And_Return201_When_InviteCode_Correct()
    {
        var anon = new AuthTestClient(app.CreateClient());

        var response = await anon.PostJsonAsync(
            RegisterUrl,
            new
            {
                Username = "p.berger",
                DisplayName = "Paul Berger",
                Password = "Doener1234",
                InviteCode = RegisterInviteCodeApp.InviteCode,
            }
        );
        var body = await response.Content.ReadFromJsonAsync<RegisterResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(body);
        Assert.Equal("p.berger", body!.Username);
    }

    [Fact]
    public async Task Should_Return403_When_InviteCode_Wrong()
    {
        var anon = new AuthTestClient(app.CreateClient());

        var response = await anon.PostJsonAsync(
            RegisterUrl,
            new
            {
                Username = "f.falsch",
                DisplayName = "Frieda Falsch",
                Password = "Doener1234",
                InviteCode = "voellig-falsch",
            }
        );

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Should_Return403_When_InviteCode_Missing()
    {
        var anon = new AuthTestClient(app.CreateClient());

        var response = await anon.PostJsonAsync(
            RegisterUrl,
            new
            {
                Username = "o.ohnecode",
                DisplayName = "Olaf Ohnecode",
                Password = "Doener1234",
            }
        );

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }
}
