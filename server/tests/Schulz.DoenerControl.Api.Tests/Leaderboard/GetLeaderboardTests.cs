using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Schulz.DoenerControl.Api.Endpoints.Leaderboards;
using Schulz.DoenerControl.Api.Tests.Auth;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Core.Enums;
using Schulz.DoenerControl.Infrastructure.Persistence;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Leaderboard;

// The Döner-Bestenliste endpoint: seeds a controlled per-user order history across two years into
// the real SQLite DB, then asserts the year-scoped ranking, medals top-3, the current-user
// highlight, the "nur noch X bis Platz N" diff to the next-higher rank, and that rank 1 has no diff.
public sealed class GetLeaderboardTests : DoenerControlTestBase
{
    private const string LeaderboardUrl = "/api/leaderboard";

    // Process-wide so synthetic OrderDay.Date values stay unique across the test methods that share
    // a single fixture database (the OrderDay.Date unique index forbids collisions).
    private static int nextDayOffset;

    public GetLeaderboardTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Return_Unauthorized_When_Not_Authenticated()
    {
        var auth = new AuthTestClient(App.CreateClient());

        var response = await auth.GetAsync(LeaderboardUrl);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Should_Rank_Medal_And_Flag_Current_User_For_The_Requested_Year()
    {
        // A dedicated future year keeps this test's standings isolated from the other methods that
        // share the one fixture database (orders accumulate across tests; the year scopes the count).
        var year = 2099;

        var tobiasId = await UserIdAsync("t.klein");
        var lukasId = await UserIdAsync("l.brandt");
        var saraId = await UserIdAsync("s.yilmaz");
        var chefId = await UserIdAsync("m.wagner");

        // 2026 standings — Tobias 5, Lukas 4, Sara 3, the chef (current user) 2 → ranks 1..4.
        // Each colleague also gets one order in a different year to prove the year scoping filters
        // those out (the chef would otherwise be rank 4 by 2026 count, not lifetime).
        await SeedAsync(database =>
        {
            SeedYearOrders(database, tobiasId, year, 5);
            SeedYearOrders(database, lukasId, year, 4);
            SeedYearOrders(database, saraId, year, 3);
            SeedYearOrders(database, chefId, year, 2);

            // Off-year noise: a pile of orders in an unrelated year that must NOT count toward the
            // requested year's ranking (proves the year scoping).
            SeedYearOrders(database, chefId, 2050, 10);
            SeedYearOrders(database, saraId, 2050, 7);
        });

        var chef = await LoginAsChefAsync();
        var response = await chef.GetAsync($"{LeaderboardUrl}?year={year}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<GetLeaderboardResponse>(
            TestContext.Current.CancellationToken
        );
        Assert.NotNull(body);
        Assert.Equal(year, body!.Year);

        var entries = body.Entries;
        Assert.Equal(
            new[] { tobiasId, lukasId, saraId, chefId },
            entries.Select(entry => entry.UserId)
        );
        Assert.Equal(new[] { 5, 4, 3, 2 }, entries.Select(entry => entry.Count));
        Assert.Equal(new[] { 1, 2, 3, 4 }, entries.Select(entry => entry.Rank));

        // Medals: 🥇/🥈/🥉 for the top three by rank; rank 4 has none.
        Assert.Equal("🥇", entries.Single(entry => entry.UserId == tobiasId).Medal);
        Assert.Equal("🥈", entries.Single(entry => entry.UserId == lukasId).Medal);
        Assert.Equal("🥉", entries.Single(entry => entry.UserId == saraId).Medal);
        Assert.Null(entries.Single(entry => entry.UserId == chefId).Medal);

        // Current user highlighted on exactly the chef row.
        var chefEntry = entries.Single(entry => entry.UserId == chefId);
        Assert.True(chefEntry.IsMe);
        Assert.All(
            entries.Where(entry => entry.UserId != chefId),
            entry => Assert.False(entry.IsMe)
        );

        // Display name + initials + avatar colour come straight from the seeded User record.
        Assert.Equal("Markus Wagner", chefEntry.DisplayName);
        Assert.Equal("MW", chefEntry.Initials);
        Assert.False(string.IsNullOrWhiteSpace(chefEntry.AvatarColorHex));

        // "Nur noch X bis Platz N": the chef is rank 4 (2) → Sara at rank 3 (3) is the next-higher
        // count, so the diff is 1 to rank 3.
        Assert.Equal(1, body.DoenerToNextRank);
        Assert.Equal(3, body.NextRank);
    }

    [Fact]
    public async Task Should_Report_No_Diff_When_Current_User_Leads_The_Year()
    {
        // A dedicated future year isolates this test's standings from the shared fixture database.
        var year = 2098;

        var chefId = await UserIdAsync("m.wagner");
        var lukasId = await UserIdAsync("l.brandt");

        await SeedAsync(database =>
        {
            SeedYearOrders(database, chefId, year, 9);
            SeedYearOrders(database, lukasId, year, 4);
        });

        var chef = await LoginAsChefAsync();
        var response = await chef.GetAsync($"{LeaderboardUrl}?year={year}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<GetLeaderboardResponse>(
            TestContext.Current.CancellationToken
        );
        Assert.NotNull(body);

        var chefEntry = body!.Entries.Single(entry => entry.UserId == chefId);
        Assert.Equal(1, chefEntry.Rank);
        Assert.Equal("🥇", chefEntry.Medal);
        Assert.True(chefEntry.IsMe);

        // Rank 1 has no next-higher rank → both diff fields are null (footer hidden).
        Assert.Null(body.DoenerToNextRank);
        Assert.Null(body.NextRank);
    }

    [Fact]
    public async Task Should_Default_To_Current_Year_When_Year_Omitted()
    {
        var currentYear = DateTimeOffset.UtcNow.Year;

        var chefId = await UserIdAsync("m.wagner");

        await SeedAsync(database =>
        {
            SeedYearOrders(database, chefId, currentYear, 3);
            // Prior-year orders that must be excluded by the default-year behaviour.
            SeedYearOrders(database, chefId, currentYear - 1, 8);
        });

        var chef = await LoginAsChefAsync();
        var response = await chef.GetAsync(LeaderboardUrl);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<GetLeaderboardResponse>(
            TestContext.Current.CancellationToken
        );
        Assert.NotNull(body);

        Assert.Equal(currentYear, body!.Year);
        var chefEntry = body.Entries.Single(entry => entry.UserId == chefId);
        Assert.Equal(3, chefEntry.Count);
    }

    [Fact]
    public async Task Should_Reject_Year_Out_Of_Range()
    {
        var chef = await LoginAsChefAsync();

        var response = await chef.GetAsync($"{LeaderboardUrl}?year=1999");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // Seeds `count` orders for the user, each on its own synthetic OrderDay (the OrderDay.Date unique
    // index forbids two rows on the same calendar day), with OccurredOn anchored to the given year —
    // the business instant the year filter keys off. The synthetic OrderDay.Date is drawn from a
    // process-wide counter so dates never collide across the test methods that share one fixture DB.
    private static void SeedYearOrders(AppDbContext database, Guid userId, int year, int count)
    {
        for (var i = 0; i < count; i++)
        {
            var occurredOn = new DateTimeOffset(year, 6, 1, 12, 0, 0, TimeSpan.Zero).AddDays(i);
            var dayDate = new DateOnly(2000, 1, 1).AddDays(
                Interlocked.Increment(ref nextDayOffset)
            );
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
                    Sauces = Sauce.Knoblauch,
                    PriceCents = 750,
                    Extra = null,
                    IsPickup = false,
                    OccurredOn = occurredOn,
                    CreatedAt = occurredOn,
                    UpdatedAt = occurredOn,
                }
            );
        }
    }

    private async Task<AuthTestClient> LoginAsChefAsync()
    {
        var auth = new AuthTestClient(App.CreateClient());
        await auth.PostJsonAsync(
            "/api/auth/login",
            new { Username = "m.wagner", Password = "doener-dev-2026" }
        );
        return auth;
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
