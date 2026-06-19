using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Schulz.DoenerControl.Api.Endpoints.Debts;
using Schulz.DoenerControl.Api.Endpoints.OrderDays;
using Schulz.DoenerControl.Api.Tests.Auth;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Core.Enums;
using Schulz.DoenerControl.Infrastructure.Persistence;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Debts;

// Shared login/order/close helpers for the debt integration tests. Each test class gets its own
// isolated SQLite DB, so opening one day per class never collides with another class.
internal static class DebtTestHelpers
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

    // Logs in a user that was seeded with a known password and MustChangePassword=false (via
    // SeedUserAsync), straight through the production login path — no forced-change dance.
    public static async Task<AuthTestClient> LoginAsync(
        DoenerControlApp app,
        string username,
        string password
    )
    {
        var auth = new AuthTestClient(app.CreateClient());
        await auth.PostJsonAsync(LoginUrl, new { Username = username, Password = password });
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

    public static async Task PlaceOrderAsync(
        AuthTestClient auth,
        Guid dayId,
        int priceCents,
        bool isPickup
    )
    {
        await auth.PutJsonAsync(
            $"/api/order-days/{dayId}/orders/mine",
            new
            {
                Lines = new[]
                {
                    new
                    {
                        ProductId = "doener",
                        Meat = (string?)"Kalb",
                        PizzaVariant = (string?)null,
                        Sauces = new[] { "Knoblauch" },
                        PriceCents = priceCents,
                        Extra = (string?)null,
                        Quantity = 1,
                    },
                },
                IsPickup = isPickup,
            }
        );
    }

    public static async Task SetCollectorAsync(AuthTestClient auth, Guid dayId, Guid collectorId)
    {
        await auth.PostJsonAsync(
            $"/api/order-days/{dayId}/collector",
            new { CollectorUserId = collectorId }
        );
    }

    // Seeds OrderDay.CollectorUserId straight in the database. Used by close-day scenarios that must
    // satisfy the collector-only close rule without going through the SetCollector flow (e.g. tests
    // that deliberately leave no collector designated, or where the collector never picked up).
    public static async Task SeedCollectorAsync(DoenerControlApp app, Guid dayId, Guid collectorId)
    {
        using var scope = app.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var day = await database.OrderDays.SingleAsync(
            d => d.Id == dayId,
            TestContext.Current.CancellationToken
        );
        day.CollectorUserId = collectorId;
        await database.SaveChangesAsync(TestContext.Current.CancellationToken);
    }

    public static async Task<Guid> UserIdAsync(DoenerControlApp app, string username)
    {
        using var scope = app.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return await database
            .Users.Where(user => user.NormalizedUserName == username)
            .Select(user => user.Id)
            .SingleAsync(TestContext.Current.CancellationToken);
    }

    // Writes one ad-hoc debt straight to the database with full control over the parties, status and
    // settled instant. Lets the history tests stage several settled payments with distinct SettledAt
    // values without burning the single OrderDay the unique Date index allows per fixture.
    public static async Task<Guid> SeedDebtAsync(
        DoenerControlApp app,
        Guid debtorUserId,
        Guid creditorUserId,
        int amountCents,
        string reason,
        PaymentStatus status,
        DateTimeOffset? settledAt
    )
    {
        using var scope = app.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var debt = new Debt
        {
            Id = Guid.NewGuid(),
            DebtorUserId = debtorUserId,
            CreditorUserId = creditorUserId,
            OrderId = null,
            OrderDayId = null,
            AmountCents = amountCents,
            Reason = reason,
            Status = status,
            CreatedAt = DateTimeOffset.UnixEpoch,
            SettledAt = settledAt,
        };
        database.Debts.Add(debt);
        await database.SaveChangesAsync(TestContext.Current.CancellationToken);
        return debt.Id;
    }

    // Opens today's day, has the chef pick up (collector) and Lukas order as a non-pickup payer,
    // then closes the day so one Döner-Tag debt (Lukas → chef, 7,50 €) is generated. Returns Lukas's
    // authenticated client and that debt's id. The single close uses up this database's one OrderDay.
    public static async Task<(AuthTestClient Lukas, Guid DebtId)> CreateDebtToChefAsync(
        DoenerControlApp app
    )
    {
        var chef = await LoginAsChefAsync(app);
        var dayId = await OpenTodayAsync(chef);
        await PlaceOrderAsync(chef, dayId, priceCents: 950, isPickup: true);

        var lukas = await LoginAsColleagueAsync(app, "l.brandt", "kollegePw11");
        await PlaceOrderAsync(lukas, dayId, priceCents: 750, isPickup: false);

        var chefId = await UserIdAsync(app, "m.wagner");
        await SetCollectorAsync(chef, dayId, chefId);
        await chef.PostAsync($"/api/order-days/{dayId}/close");

        var mine = await lukas.GetAsync("/api/debts/mine");
        var body = await mine.Content.ReadFromJsonAsync<GetMyDebtsResponse>(
            TestContext.Current.CancellationToken
        );
        return (lukas, body!.Debts[0].Id);
    }
}
