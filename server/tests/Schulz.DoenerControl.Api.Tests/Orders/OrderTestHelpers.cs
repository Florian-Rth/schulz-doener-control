using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Schulz.DoenerControl.Api.Endpoints.OrderDays;
using Schulz.DoenerControl.Api.Tests.Auth;
using Schulz.DoenerControl.Infrastructure.Persistence;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Orders;

internal static class OrderTestHelpers
{
    private const string LoginUrl = "/api/auth/login";
    private const string ChangePasswordUrl = "/api/auth/change-password";
    private const string OpenUrl = "/api/order-days/open";
    private const string InitialPassword = TestSeeding.InitialColleaguePassword;

    public static async Task<AuthTestClient> LoginAsChefAsync(DoenerControlApp app)
    {
        var auth = new AuthTestClient(app.CreateClient());
        await auth.PostJsonAsync(
            LoginUrl,
            new { Username = TestSeeding.ChefUsername, Password = TestSeeding.ChefPassword }
        );
        return auth;
    }

    // Logs in a freshly provisioned colleague, clears the forced-change flag with a per-user new
    // password, then re-logs in so the returned client can hit protected endpoints.
    public static async Task<AuthTestClient> LoginAsColleagueAsync(
        DoenerControlApp app,
        string username,
        string newPassword
    )
    {
        var first = new AuthTestClient(app.CreateClient());
        await first.PostJsonAsync(
            LoginUrl,
            new { Username = username, Password = InitialPassword }
        );
        await first.PostJsonAsync(
            ChangePasswordUrl,
            new { CurrentPassword = InitialPassword, NewPassword = newPassword }
        );

        var auth = new AuthTestClient(app.CreateClient());
        await auth.PostJsonAsync(LoginUrl, new { Username = username, Password = newPassword });
        return auth;
    }

    public static async Task<Guid> OpenTodayAsync(AuthTestClient auth)
    {
        var open = await auth.PostAsync(OpenUrl);
        var body = await open.Content.ReadFromJsonAsync<OpenDayResponse>(
            TestContext.Current.CancellationToken
        );
        return body!.Day.Id;
    }

    public static async Task<Guid> UserIdByUsernameAsync(DoenerControlApp app, string username)
    {
        using var scope = app.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return await database
            .Users.Where(user => user.NormalizedUserName == username)
            .Select(user => user.Id)
            .SingleAsync(TestContext.Current.CancellationToken);
    }

    public static object DoenerBody(
        string productId = "doener",
        string meat = "Kalb",
        int priceCents = 750,
        bool isPickup = false,
        string[]? sauces = null
    ) =>
        new
        {
            ProductId = productId,
            Meat = meat,
            PizzaVariant = (string?)null,
            Sauces = sauces ?? new[] { "Knoblauch" },
            PriceCents = priceCents,
            Extra = (string?)null,
            IsPickup = isPickup,
        };
}
