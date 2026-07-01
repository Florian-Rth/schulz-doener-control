using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Schulz.DoenerControl.Api.Endpoints.Dashboard;
using Schulz.DoenerControl.Api.Endpoints.Leaderboards;
using Schulz.DoenerControl.Api.Tests.Auth;
using Schulz.DoenerControl.Api.Tests.Dashboard;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Core.Enums;
using Schulz.DoenerControl.Infrastructure.Persistence;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Tiers;

// The 🐎 Packesel superlative + the leaderboard tier-emoji projection. Seeds, into the real SQLite
// DB, the chef as the runaway top pickup person over the rolling 90-day window plus a colleague who
// only ever orders (never picks up). Asserts the chef earns the global Packesel on both the
// dashboard tier card and their leaderboard row (the two agree), while the non-picking colleague
// shows their order-pattern tier emoji (all-Knoblauch → 🐺 Der Knoblauch-Wolf). All instants are
// anchored on the fixed test clock so they land inside the window the server measures from.
public sealed class PackeselTierTests : DoenerControlTestBase
{
    public PackeselTierTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Award_Packesel_To_Top_Picker_And_Pattern_Emoji_To_Non_Picker()
    {
        var now = FixedTimeProvider.Instant;

        var chefId = await UserIdAsync("m.wagner");
        var lukasId = await UserIdAsync("l.brandt");

        var dayOffset = 0;
        await SeedAsync(database =>
        {
            // Chef: 3 pickup Döner-Tage in the window → the single top picker (>= 2) → Packesel.
            for (var i = 0; i < 3; i++)
                AddOrder(
                    database,
                    chefId,
                    now.AddDays(-i),
                    isPickup: true,
                    Sauce.Knoblauch,
                    dayOffset++
                );

            // Lukas: 5 all-Knoblauch orders, never a pickup → pattern tier 🐺 Der Knoblauch-Wolf.
            for (var i = 0; i < 5; i++)
                AddOrder(
                    database,
                    lukasId,
                    now.AddDays(-i),
                    isPickup: false,
                    Sauce.Knoblauch,
                    dayOffset++
                );
        });

        var chef = await DashboardTestHelpers.LoginAsChefAsync(App);

        // Dashboard tier card: the chef wears the Packesel (global pickup-leader override).
        var dashboardResponse = await chef.GetAsync("/api/dashboard");
        Assert.Equal(HttpStatusCode.OK, dashboardResponse.StatusCode);
        var dashboard = await dashboardResponse.Content.ReadFromJsonAsync<GetDashboardResponse>(
            TestContext.Current.CancellationToken
        );
        Assert.NotNull(dashboard);
        Assert.Equal("🐎", dashboard!.Tier.Emoji);
        Assert.Equal("Der Packesel", dashboard.Tier.Name);

        // Dashboard leaderboard rows carry the tier emoji and AGREE with the tier card for the chef.
        var dashChefRow = Assert.Single(dashboard.Leaderboard.Rows, row => row.UserId == chefId);
        Assert.Equal("🐎", dashChefRow.TierEmoji);
        var dashLukasRow = Assert.Single(dashboard.Leaderboard.Rows, row => row.UserId == lukasId);
        Assert.Equal("🐺", dashLukasRow.TierEmoji);

        // Standalone leaderboard endpoint carries the same tierEmoji projection.
        var leaderboardResponse = await chef.GetAsync($"/api/leaderboard?year={now.Year}");
        Assert.Equal(HttpStatusCode.OK, leaderboardResponse.StatusCode);
        var leaderboard =
            await leaderboardResponse.Content.ReadFromJsonAsync<GetLeaderboardResponse>(
                TestContext.Current.CancellationToken
            );
        Assert.NotNull(leaderboard);

        var chefEntry = Assert.Single(leaderboard!.Entries, entry => entry.UserId == chefId);
        Assert.Equal("🐎", chefEntry.TierEmoji);
        var lukasEntry = Assert.Single(leaderboard.Entries, entry => entry.UserId == lukasId);
        Assert.Equal("🐺", lukasEntry.TierEmoji);
    }

    // Adds one closed OrderDay + one doener Order for the user, flagged as a pickup or not. The
    // OrderDay's Date is made unique via dayOffset so the unique Date index never trips; the Order's
    // OccurredOn is the business instant the 90-day window keys off. A non-pickup order gets a settled
    // debt so it counts under the fail-safe stats rule (a pickup order needs no debt — the collector
    // owes no one).
    private static void AddOrder(
        AppDbContext database,
        Guid userId,
        DateTimeOffset occurredOn,
        bool isPickup,
        Sauce sauces,
        int dayOffset
    )
    {
        var day = new OrderDay
        {
            Id = Guid.NewGuid(),
            Date = new DateOnly(2000, 1, 1).AddDays(dayOffset),
            Status = OrderDayStatus.Closed,
            Synonym = "Drehspieß-Tasche",
            OrderCutoffAt = occurredOn,
            OpenedByUserId = userId,
            OpenedAt = occurredOn,
            ClosedAt = occurredOn,
        };
        database.OrderDays.Add(day);

        var orderId = Guid.NewGuid();
        database.Orders.Add(
            new Order
            {
                Id = orderId,
                OrderDayId = day.Id,
                UserId = userId,
                IsPickup = isPickup,
                OccurredOn = occurredOn,
                CreatedAt = occurredOn,
                UpdatedAt = occurredOn,
                Lines = new List<OrderLine>
                {
                    new()
                    {
                        Id = Guid.NewGuid(),
                        OrderId = orderId,
                        ProductId = "doener",
                        Kind = ProductKind.Doener,
                        Meat = MeatType.Kalb,
                        PizzaVariant = null,
                        Sauces = sauces,
                        PriceCents = 800,
                        Extra = null,
                        Quantity = 1,
                    },
                },
            }
        );

        if (!isPickup)
        {
            database.Debts.Add(
                new Debt
                {
                    Id = Guid.NewGuid(),
                    DebtorUserId = userId,
                    CreditorUserId = userId,
                    OrderId = orderId,
                    OrderDayId = day.Id,
                    AmountCents = 800,
                    Reason = "Döner-Tag",
                    Status = PaymentStatus.Settled,
                    CreatedAt = occurredOn,
                    SettledAt = occurredOn,
                }
            );
        }
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
