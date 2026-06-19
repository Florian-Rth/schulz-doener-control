using Schulz.DoenerControl.Api.Tests.Auth;

namespace Schulz.DoenerControl.Api.Tests.OrderDays;

internal static class OrderDayTestHelpers
{
    public static async Task<AuthTestClient> LoginAsChefAsync(DoenerControlApp app, string loginUrl)
    {
        var auth = new AuthTestClient(app.CreateClient());
        await auth.PostJsonAsync(
            loginUrl,
            new { Username = TestSeeding.ChefUsername, Password = TestSeeding.ChefPassword }
        );
        return auth;
    }
}
