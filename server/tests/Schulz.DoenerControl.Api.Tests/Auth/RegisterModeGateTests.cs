using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Schulz.DoenerControl.Api.Endpoints.Auth;
using Schulz.DoenerControl.Core.Enums;
using Schulz.DoenerControl.Infrastructure.Persistence;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Auth;

// The runtime registration gate driven by the DB-backed RegistrationMode singleton:
//  Enabled       — anyone may register (the seeded default).
//  Disabled      — every register attempt is forbidden (403).
//  SecretKeyOnly — only a request carrying the correct secret key registers; a missing or wrong key
//                  is forbidden (403).
//
// Each test sets the exact mode it asserts before registering, so the cases are order-independent
// despite sharing the per-class singleton row. Mode is written straight through the DbContext to
// keep these focused on the anonymous register endpoint's gating.
public sealed class RegisterModeGateTests : DoenerControlTestBase
{
    private const string RegisterUrl = "/api/auth/register";
    private const string SecretKey = "GEHEIM-DOENER-2026";

    public RegisterModeGateTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Register_And_Return201_When_Mode_Enabled()
    {
        await SetModeAsync(RegistrationModeType.Enabled, null);
        var anon = new AuthTestClient(App.CreateClient());

        var response = await anon.PostJsonAsync(
            RegisterUrl,
            new
            {
                Username = "e.enabled",
                DisplayName = "Erna Enabled",
                Password = "Doener1234",
            }
        );

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<RegisterResponse>(
            TestContext.Current.CancellationToken
        );
        Assert.NotNull(body);
        Assert.Equal("e.enabled", body!.Username);
    }

    [Fact]
    public async Task Should_Return403_When_Mode_Disabled()
    {
        await SetModeAsync(RegistrationModeType.Disabled, null);
        var anon = new AuthTestClient(App.CreateClient());

        var response = await anon.PostJsonAsync(
            RegisterUrl,
            new
            {
                Username = "d.disabled",
                DisplayName = "Dirk Disabled",
                Password = "Doener1234",
            }
        );

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Should_Return403_When_SecretKeyOnly_And_Key_Missing()
    {
        await SetModeAsync(RegistrationModeType.SecretKeyOnly, SecretKey);
        var anon = new AuthTestClient(App.CreateClient());

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

    [Fact]
    public async Task Should_Return403_When_SecretKeyOnly_And_Key_Wrong()
    {
        await SetModeAsync(RegistrationModeType.SecretKeyOnly, SecretKey);
        var anon = new AuthTestClient(App.CreateClient());

        var response = await anon.PostJsonAsync(
            RegisterUrl,
            new
            {
                Username = "f.falsch",
                DisplayName = "Frieda Falsch",
                Password = "Doener1234",
                SecretKey = "voellig-falsch",
            }
        );

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Should_Register_And_Return201_When_SecretKeyOnly_And_Key_Correct()
    {
        await SetModeAsync(RegistrationModeType.SecretKeyOnly, SecretKey);
        var anon = new AuthTestClient(App.CreateClient());

        var response = await anon.PostJsonAsync(
            RegisterUrl,
            new
            {
                Username = "p.berger",
                DisplayName = "Paul Berger",
                Password = "Doener1234",
                SecretKey,
            }
        );

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<RegisterResponse>(
            TestContext.Current.CancellationToken
        );
        Assert.NotNull(body);
        Assert.Equal("p.berger", body!.Username);
    }

    [Fact]
    public async Task Should_Register_When_SecretKeyOnly_And_Key_Supplied_Under_Legacy_Code_Alias()
    {
        await SetModeAsync(RegistrationModeType.SecretKeyOnly, SecretKey);
        var anon = new AuthTestClient(App.CreateClient());

        // The printed QR-code flow posts the secret under the legacy "code" field name; the endpoint
        // coalesces it onto SecretKey, so registration still succeeds.
        var response = await anon.PostJsonAsync(
            RegisterUrl,
            new
            {
                Username = "l.legacy",
                DisplayName = "Lara Legacy",
                Password = "Doener1234",
                Code = SecretKey,
            }
        );

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    private async Task SetModeAsync(RegistrationModeType mode, string? secretKey)
    {
        using var scope = App.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var row = await database.RegistrationMode.FirstAsync(TestContext.Current.CancellationToken);
        row.Mode = (int)mode;
        row.SecretKey = secretKey;
        await database.SaveChangesAsync(TestContext.Current.CancellationToken);
    }
}
