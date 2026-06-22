using System.Net;
using System.Net.Http.Json;
using Schulz.DoenerControl.Api.Endpoints.Auth;
using Schulz.DoenerControl.Api.Tests.Admin;
using Schulz.DoenerControl.Core.Enums;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Auth;

// Public self-registration (the QR-code flow): anonymous, throttled, always creates an Employee
// account with the password the colleague chooses (no forced change). Exercises the real SQLite
// harness end to end, then proves the new credentials authenticate through the production login
// path.
public sealed class RegisterTests : DoenerControlTestBase
{
    private const string RegisterUrl = "/api/auth/register";
    private const string LoginUrl = "/api/auth/login";

    public RegisterTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Register_And_Return201_When_Valid()
    {
        var anon = new AuthTestClient(App.CreateClient());

        var response = await anon.PostJsonAsync(
            RegisterUrl,
            new
            {
                Username = "c.lehmann",
                DisplayName = "Carla Lehmann",
                PayPalHandle = "CarlaL",
                Password = "Doener1234",
            }
        );
        var body = await response.Content.ReadFromJsonAsync<RegisterResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(body);
        Assert.Equal("c.lehmann", body!.Username);
        Assert.Equal("Carla Lehmann", body.DisplayName);
        Assert.NotEqual(Guid.Empty, body.UserId);

        var persisted = await AdminUserTestHelpers.FindUserAsync(App, "c.lehmann");
        Assert.NotNull(persisted);
        Assert.True(persisted!.IsActive);
        Assert.Equal("CarlaL", persisted.PayPalHandle);
    }

    [Fact]
    public async Task Should_Create_Employee_Account_When_Registering()
    {
        var anon = new AuthTestClient(App.CreateClient());

        await anon.PostJsonAsync(
            RegisterUrl,
            new
            {
                Username = "g.roth",
                DisplayName = "Greta Roth",
                Password = "Doener1234",
            }
        );

        var persisted = await AdminUserTestHelpers.FindUserAsync(App, "g.roth");
        Assert.NotNull(persisted);
        Assert.Equal(UserRole.Employee, persisted!.Role);
    }

    [Fact]
    public async Task Should_Return409_When_Username_Already_Taken_CaseInsensitive()
    {
        var anon = new AuthTestClient(App.CreateClient());

        var first = await anon.PostJsonAsync(
            RegisterUrl,
            new
            {
                Username = "Max",
                DisplayName = "Max Mustermann",
                Password = "Doener1234",
            }
        );
        Assert.Equal(HttpStatusCode.Created, first.StatusCode);

        var second = await anon.PostJsonAsync(
            RegisterUrl,
            new
            {
                Username = "max",
                DisplayName = "Max Zweiter",
                Password = "Doener1234",
            }
        );

        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
    }

    [Fact]
    public async Task Should_Return400_When_Username_Has_Invalid_Characters()
    {
        var anon = new AuthTestClient(App.CreateClient());

        var response = await anon.PostJsonAsync(
            RegisterUrl,
            new
            {
                Username = "Has Space",
                DisplayName = "Wer auch immer",
                Password = "Doener1234",
            }
        );

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Should_Return400_When_DisplayName_Empty()
    {
        var anon = new AuthTestClient(App.CreateClient());

        var response = await anon.PostJsonAsync(
            RegisterUrl,
            new
            {
                Username = "k.leer",
                DisplayName = "",
                Password = "Doener1234",
            }
        );

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Should_Return400_When_Password_Too_Short()
    {
        var anon = new AuthTestClient(App.CreateClient());

        var response = await anon.PostJsonAsync(
            RegisterUrl,
            new
            {
                Username = "s.kurz",
                DisplayName = "Sven Kurz",
                Password = "Ab1",
            }
        );

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Should_Return400_When_Password_Has_No_Letter()
    {
        var anon = new AuthTestClient(App.CreateClient());

        var response = await anon.PostJsonAsync(
            RegisterUrl,
            new
            {
                Username = "n.zahl",
                DisplayName = "Nina Zahl",
                Password = "1234567890",
            }
        );

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Should_Return400_When_Password_Has_No_Digit()
    {
        var anon = new AuthTestClient(App.CreateClient());

        var response = await anon.PostJsonAsync(
            RegisterUrl,
            new
            {
                Username = "b.buchstabe",
                DisplayName = "Ben Buchstabe",
                Password = "OhneZiffern",
            }
        );

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Should_Let_User_Login_Right_After_Registering_Without_Forced_Change()
    {
        var anon = new AuthTestClient(App.CreateClient());
        await anon.PostJsonAsync(
            RegisterUrl,
            new
            {
                Username = "w.frisch",
                DisplayName = "Wanda Frisch",
                Password = "Doener1234",
            }
        );

        var newUser = new AuthTestClient(App.CreateClient());
        var loginResponse = await newUser.PostJsonAsync(
            LoginUrl,
            new { Username = "w.frisch", Password = "Doener1234" }
        );
        var loginBody = await loginResponse.Content.ReadFromJsonAsync<LoginResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
        Assert.NotNull(loginBody);
        Assert.False(loginBody!.MustChangePassword);
    }
}
