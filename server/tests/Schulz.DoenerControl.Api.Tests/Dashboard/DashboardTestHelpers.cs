using Schulz.DoenerControl.Api.Tests.Auth;

namespace Schulz.DoenerControl.Api.Tests.Dashboard;

// Login helper for the dashboard integration tests. The chef is the verified test-seeded admin with
// MustChangePassword=false, so it can hit protected endpoints without the gate.
internal static class DashboardTestHelpers
{
    private const string LoginUrl = "/api/auth/login";

    public static async Task<AuthTestClient> LoginAsChefAsync(DoenerControlApp app)
    {
        var auth = new AuthTestClient(app.CreateClient());
        await auth.PostJsonAsync(
            LoginUrl,
            new { Username = TestSeeding.ChefUsername, Password = TestSeeding.ChefPassword }
        );
        return auth;
    }
}
