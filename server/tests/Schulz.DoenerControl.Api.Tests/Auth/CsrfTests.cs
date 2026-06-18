using System.Net;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Auth;

// Proves the double-submit CSRF guard on authenticated mutating endpoints: a request whose
// X-XSRF-TOKEN header is absent or does not match the dc_xsrf cookie is rejected with 403; a
// matching token passes the guard (the request then succeeds on its own merits).
public sealed class CsrfTests : DoenerControlTestBase
{
    private const string LoginUrl = "/api/auth/login";
    private const string LogoutUrl = "/api/auth/logout";

    public CsrfTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Reject_Mutation_When_Csrf_Header_Missing()
    {
        var auth = await LoggedInClientAsync();
        auth.SuppressXsrfHeader = true;

        var response = await auth.PostAsync(LogoutUrl);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Should_Reject_Mutation_When_Csrf_Header_Mismatched()
    {
        var auth = await LoggedInClientAsync();
        auth.OverrideXsrfHeader("a-token-that-does-not-match-the-cookie");

        var response = await auth.PostAsync(LogoutUrl);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Should_Allow_Mutation_When_Csrf_Header_Matches_Cookie()
    {
        var auth = await LoggedInClientAsync();

        // The client echoes the dc_xsrf cookie by default, so this passes the guard.
        var response = await auth.PostAsync(LogoutUrl);

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    private async Task<AuthTestClient> LoggedInClientAsync()
    {
        var auth = new AuthTestClient(App.CreateClient());
        await auth.PostJsonAsync(
            LoginUrl,
            new { Username = "m.wagner", Password = "doener-dev-2026" }
        );
        return auth;
    }
}
