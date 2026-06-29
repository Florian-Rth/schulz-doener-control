using System.Net;
using System.Net.Http.Json;
using Schulz.DoenerControl.Api.Endpoints.Auth;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Auth;

public sealed class GetMeTests : DoenerControlTestBase
{
    private const string LoginUrl = "/api/auth/login";
    private const string MeUrl = "/api/auth/me";

    public GetMeTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Return_Caller_Profile_With_Derived_Name_Fields()
    {
        var auth = new AuthTestClient(App.CreateClient());
        await auth.PostJsonAsync(
            LoginUrl,
            new { Username = "m.wagner", Password = "doener-dev-2026" }
        );

        var response = await auth.GetAsync(MeUrl);
        var body = await response.Content.ReadFromJsonAsync<GetMeResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.Equal("Markus Wagner", body!.DisplayName);
        Assert.Equal("Markus", body.FirstName);
        Assert.Equal("MW", body.Initials);
        Assert.Equal("Admin", body.Role);
        Assert.False(body.MustChangePassword);
        Assert.True(body.PayPalHandleSet);
    }

    [Fact]
    public async Task Should_Reissue_Xsrf_Cookie_When_Hydrating()
    {
        var auth = new AuthTestClient(App.CreateClient());
        await auth.PostJsonAsync(
            LoginUrl,
            new { Username = "m.wagner", Password = "doener-dev-2026" }
        );
        var loginXsrf = auth.XsrfValue;

        await auth.GetAsync(MeUrl);

        Assert.NotNull(auth.XsrfValue);
        Assert.NotEqual(loginXsrf, auth.XsrfValue);
    }

    [Fact]
    public async Task Should_Return_WorkEmail_When_Set()
    {
        var anon = new AuthTestClient(App.CreateClient());
        await anon.PostJsonAsync(
            "/api/auth/register",
            new
            {
                Username = "e.mailer",
                DisplayName = "Erika Mailer",
                WorkEmail = "erika@schulz.st",
                Password = "Doener1234",
            }
        );

        var auth = new AuthTestClient(App.CreateClient());
        await auth.PostJsonAsync(LoginUrl, new { Username = "e.mailer", Password = "Doener1234" });

        var response = await auth.GetAsync(MeUrl);
        var body = await response.Content.ReadFromJsonAsync<GetMeResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.Equal("erika@schulz.st", body!.WorkEmail);
    }
}
