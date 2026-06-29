using System.Net;
using System.Net.Http.Json;
using Schulz.DoenerControl.Api.Endpoints.Auth;
using Schulz.DoenerControl.Api.Endpoints.Profile;
using Schulz.DoenerControl.Api.Tests.Auth;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Profile;

public sealed class PutWorkEmailTests : DoenerControlTestBase
{
    private const string LoginUrl = "/api/auth/login";
    private const string WorkEmailUrl = "/api/profile/work-email";
    private const string MeUrl = "/api/auth/me";

    public PutWorkEmailTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Set_WorkEmail_When_Valid()
    {
        var auth = await LoginAsChefAsync();

        var putResponse = await auth.PutJsonAsync(
            WorkEmailUrl,
            new { WorkEmail = "chef@schulz.st" }
        );
        var putBody = await putResponse.Content.ReadFromJsonAsync<PutWorkEmailResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, putResponse.StatusCode);
        Assert.NotNull(putBody);
        Assert.Equal("chef@schulz.st", putBody!.WorkEmail);
        Assert.True(putBody.WorkEmailSet);

        var meBody = await (await auth.GetAsync(MeUrl)).Content.ReadFromJsonAsync<GetMeResponse>(
            TestContext.Current.CancellationToken
        );
        Assert.NotNull(meBody);
        Assert.Equal("chef@schulz.st", meBody!.WorkEmail);
    }

    [Fact]
    public async Task Should_Clear_WorkEmail_When_Blank()
    {
        var auth = await LoginAsChefAsync();
        await auth.PutJsonAsync(WorkEmailUrl, new { WorkEmail = "chef@schulz.st" });

        var clearResponse = await auth.PutJsonAsync(WorkEmailUrl, new { WorkEmail = "" });
        var clearBody = await clearResponse.Content.ReadFromJsonAsync<PutWorkEmailResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, clearResponse.StatusCode);
        Assert.NotNull(clearBody);
        Assert.Null(clearBody!.WorkEmail);
        Assert.False(clearBody.WorkEmailSet);
    }

    [Fact]
    public async Task Should_Return400_When_Invalid_Email()
    {
        var auth = await LoginAsChefAsync();

        var response = await auth.PutJsonAsync(WorkEmailUrl, new { WorkEmail = "kein-email" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Should_Return401_When_Unauthenticated()
    {
        var auth = new AuthTestClient(App.CreateClient());

        var response = await auth.PutJsonAsync(WorkEmailUrl, new { WorkEmail = "chef@schulz.st" });

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
