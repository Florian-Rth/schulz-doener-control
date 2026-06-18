using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Schulz.DoenerControl.Api.Endpoints.Dashboard;
using Schulz.DoenerControl.Api.Tests.Auth;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Core.Enums;
using Schulz.DoenerControl.Infrastructure.Persistence;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Dashboard;

// The aggregate home-screen endpoint composing stats + tier + leaderboard + open debts in one
// round-trip. Seeds a controlled order history (own OccurredOn instants) plus an open debt directly
// into the real SQLite DB, then asserts every derived figure against that fixture.
public sealed class GetDashboardTests : DoenerControlTestBase
{
    public GetDashboardTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Return_Unauthorized_When_Not_Authenticated()
    {
        var auth = new AuthTestClient(App.CreateClient());

        var response = await auth.GetAsync("/api/dashboard");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Should_Compose_Stats_Tier_Leaderboard_And_OpenDebts()
    {
        var now = DateTimeOffset.UtcNow;

        var chefId = await UserIdAsync("m.wagner");
        var lukasId = await UserIdAsync("l.brandt");
        var saraId = await UserIdAsync("s.yilmaz");

        // Chef history: three orders in three consecutive ISO weeks ending this week (drives the
        // streak), one a year ago (lifetime only, outside the year + the streak), all Knoblauch
        // doener so the tier resolves to the Wolf.
        var chefOrders = new[]
        {
            (instant: now, price: 750),
            (instant: now.AddDays(-7), price: 800),
            (instant: now.AddDays(-14), price: 950),
            (instant: now.AddYears(-1), price: 700),
        };

        // Monthly spend sums only the chef orders whose OccurredOn lands in the current calendar
        // month; compute the expectation from the same fixture so it stays date-robust.
        var expectedMonthlyCents = chefOrders
            .Where(o => o.instant.Year == now.Year && o.instant.Month == now.Month)
            .Sum(o => o.price);

        await SeedAsync(database =>
        {
            // Each OrderDay needs a unique Date (unique index), so every seeded order gets its own
            // synthetic day; OccurredOn on the Order is the business instant the stats key off.
            var dayOffset = 0;
            foreach (var (instant, price) in chefOrders)
                AddDoenerOrder(database, chefId, instant, price, Sauce.Knoblauch, dayOffset++);

            // Two colleagues with this-year orders so the leaderboard ranks the chef behind them.
            for (var i = 0; i < 6; i++)
                AddDoenerOrder(database, lukasId, now, 750, Sauce.Kraeuter, dayOffset++);
            for (var i = 0; i < 5; i++)
                AddDoenerOrder(database, saraId, now, 800, Sauce.Scharf, dayOffset++);

            // One open debt the chef owes Lukas (drives the "Offen" stat + the open-debts ledger).
            database.Debts.Add(
                new Debt
                {
                    Id = Guid.NewGuid(),
                    DebtorUserId = chefId,
                    CreditorUserId = lukasId,
                    OrderId = null,
                    OrderDayId = null,
                    AmountCents = 1150,
                    Reason = "Döner-Tag",
                    Status = PaymentStatus.Open,
                    CreatedAt = now,
                    SettledAt = null,
                }
            );
        });

        var chef = await DashboardTestHelpers.LoginAsChefAsync(App);
        var response = await chef.GetAsync("/api/dashboard");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<GetDashboardResponse>(
            TestContext.Current.CancellationToken
        );
        Assert.NotNull(body);

        // Stats: lifetime counts every chef order; monthly sums only the current calendar month by
        // OccurredOn; open = the one open debt; streak = 3 consecutive ISO weeks ending this week.
        Assert.Equal(4, body!.Stats.TotalLifetimeCount);
        Assert.Equal(expectedMonthlyCents, body.Stats.MonthlySpendCents);
        Assert.Equal(1, body.Stats.OpenPaymentsCount);
        Assert.Equal(3, body.Stats.StreakWeeks);

        // Tier: all-Knoblauch doener history → 🐺 Der Knoblauch-Wolf, computed over the 90-day window.
        Assert.Equal("🐺", body.Tier.Emoji);
        Assert.Equal("Der Knoblauch-Wolf", body.Tier.Name);

        // Leaderboard for the current year: Lukas (6) is rank 1; the chef row (3 this-year orders)
        // is flagged as the current user.
        Assert.NotEmpty(body.Leaderboard.Rows);
        var chefRow = Assert.Single(body.Leaderboard.Rows, row => row.UserId == chefId);
        Assert.True(chefRow.IsCurrentUser);
        Assert.Equal(3, chefRow.Count);
        var lukasRow = Assert.Single(body.Leaderboard.Rows, row => row.UserId == lukasId);
        Assert.Equal(1, lukasRow.Rank);
        Assert.Equal(6, lukasRow.Count);

        // Open debts ledger: the single 11,50 € the chef owes Lukas.
        Assert.Equal(1, body.OpenDebts.OpenCount);
        Assert.Equal(1150, body.OpenDebts.TotalCents);
        var debtRow = Assert.Single(body.OpenDebts.Debts);
        Assert.Equal("Lukas Brandt", debtRow.PersonName);
        Assert.Equal(1150, debtRow.AmountCents);
    }

    // Adds one closed OrderDay + one doener Order for the user. The OrderDay's Date is made unique
    // via dayOffset (one day apart) so the unique Date index never trips; the Order's OccurredOn is
    // the business instant that every derived stat reads.
    private static void AddDoenerOrder(
        AppDbContext database,
        Guid userId,
        DateTimeOffset occurredOn,
        int priceCents,
        Sauce sauces,
        int dayOffset
    )
    {
        var dayDate = new DateOnly(2000, 1, 1).AddDays(dayOffset);
        var day = new OrderDay
        {
            Id = Guid.NewGuid(),
            Date = dayDate,
            Status = OrderDayStatus.Closed,
            Synonym = "Drehspieß-Tasche",
            OrderCutoffAt = occurredOn,
            OpenedByUserId = userId,
            OpenedAt = occurredOn,
            ClosedAt = occurredOn,
        };

        database.OrderDays.Add(day);
        database.Orders.Add(
            new Order
            {
                Id = Guid.NewGuid(),
                OrderDayId = day.Id,
                UserId = userId,
                ProductId = "doener",
                Kind = ProductKind.Doener,
                Meat = MeatType.Kalb,
                PizzaVariant = null,
                Sauces = sauces,
                PriceCents = priceCents,
                Extra = null,
                IsPickup = false,
                OccurredOn = occurredOn,
                CreatedAt = occurredOn,
                UpdatedAt = occurredOn,
            }
        );
    }

    private async Task SeedAsync(Action<AppDbContext> seed)
    {
        using var scope = App.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        seed(database);
        await database.SaveChangesAsync(TestContext.Current.CancellationToken);
    }

    private async Task<Guid> UserIdAsync(string normalizedUserName)
    {
        using var scope = App.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return await database
            .Users.Where(user => user.NormalizedUserName == normalizedUserName)
            .Select(user => user.Id)
            .SingleAsync(TestContext.Current.CancellationToken);
    }
}
