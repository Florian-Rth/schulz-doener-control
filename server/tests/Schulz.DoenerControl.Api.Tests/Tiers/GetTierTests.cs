using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Schulz.DoenerControl.Api.Endpoints.Tiers;
using Schulz.DoenerControl.Api.Tests.Auth;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Core.Enums;
using Schulz.DoenerControl.Infrastructure.Persistence;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Tiers;

// The two tier endpoints (PLAN slices F13): GET /api/tiere/mine derives the caller's Döner-Tier from
// their last-90-days order history, GET /api/tiere lists all 15 Tiere with the caller's own
// one flagged. Seeds the Chef's canonical 12-order MY_HISTORY (all recent so they fall inside the
// window) directly into the real SQLite DB and asserts both endpoints against that fixture.
public sealed class GetTierTests : DoenerControlTestBase
{
    // The Chef's exact 12-order history from the mock (MY_HISTORY): garlic ~0.92 (>= 0.7),
    // spicy ~0.42 (< 0.6) => first match is 🐺 Der Knoblauch-Wolf.
    private static readonly (string ProductId, MeatType? Meat, Sauce Sauces)[] MarkusHistory =
    {
        ("doener", MeatType.Kalb, Sauce.Knoblauch | Sauce.Kraeuter),
        ("doener", MeatType.Kalb, Sauce.Knoblauch | Sauce.Scharf),
        ("duerum", MeatType.Kalb, Sauce.Knoblauch | Sauce.Kraeuter | Sauce.Scharf),
        ("doener", MeatType.Kalb, Sauce.Knoblauch),
        ("big", MeatType.Kalb, Sauce.Knoblauch | Sauce.Scharf),
        ("doener", MeatType.Haehnchen, Sauce.Knoblauch | Sauce.Kraeuter),
        ("box", MeatType.Kalb, Sauce.Knoblauch),
        ("doener", MeatType.Kalb, Sauce.Kraeuter),
        ("doener", MeatType.Kalb, Sauce.Knoblauch | Sauce.Scharf),
        ("duerum", MeatType.Kalb, Sauce.Knoblauch | Sauce.Kraeuter),
        ("doener", MeatType.Kalb, Sauce.Knoblauch | Sauce.Scharf),
        ("doener", MeatType.Kalb, Sauce.Knoblauch),
    };

    public GetTierTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Return_Unauthorized_When_Not_Authenticated_For_Mine()
    {
        var auth = new AuthTestClient(App.CreateClient());

        var response = await auth.GetAsync("/api/tiere/mine");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Should_Return_Unauthorized_When_Not_Authenticated_For_Catalog()
    {
        var auth = new AuthTestClient(App.CreateClient());

        var response = await auth.GetAsync("/api/tiere");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Should_Resolve_KnoblauchWolf_When_Markus_Canonical_History()
    {
        var chefId = await UserIdAsync("m.wagner");
        await SeedMarkusHistoryAsync(chefId, dayBase: 0);

        var chef = await LoginAsChefAsync();
        var response = await chef.GetAsync("/api/tiere/mine");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<GetMyTierResponse>(
            TestContext.Current.CancellationToken
        );
        Assert.NotNull(body);
        Assert.Equal("🐺", body!.Emoji);
        Assert.Equal("Der Knoblauch-Wolf", body.Name);
        // Count is the number of orders the tier was computed over: at least the 12 seeded here
        // (the exact 12-count is pinned by the pure TierCalculator unit test). Asserting > 0 keeps
        // this robust against the shared per-class DB while still proving the window is populated.
        Assert.True(body.Count > 0);
        Assert.Equal(3, body.Tags.Count);
    }

    [Fact]
    public async Task Should_Return_The_Full_Catalogue_With_IsMine_On_Caller_Tier()
    {
        var chefId = await UserIdAsync("m.wagner");
        // A distinct date base so this test's OrderDay.Date rows never collide with the mine test's
        // rows (both run against the shared per-class SQLite DB; OrderDay.Date is uniquely indexed).
        await SeedMarkusHistoryAsync(chefId, dayBase: 100);

        var chef = await LoginAsChefAsync();
        var response = await chef.GetAsync("/api/tiere");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        // PLAN #24: the catalogue is a bare array (FE TierCatalogSchema = z.array), no wrapper.
        var body = await response.Content.ReadFromJsonAsync<List<TierCatalogEntrySummaryDto>>(
            TestContext.Current.CancellationToken
        );
        Assert.NotNull(body);

        // The Packesel superlative leads, then the 15 pattern Tiere; last = solider Döner-Bürger.
        Assert.Equal(16, body!.Count);
        Assert.Equal("Der Packesel", body[0].Name);
        Assert.Equal("Die Bürowaffe", body[1].Name);
        Assert.Equal("Der solide Döner-Bürger", body[15].Name);

        // Exactly one entry flagged IsMine, and it is the caller's computed tier. The chef seeded no
        // pickups here, so the Packesel is not theirs — it is their order-pattern tier.
        var mine = Assert.Single(body, tier => tier.IsMine);
        Assert.Equal("Der Knoblauch-Wolf", mine.Name);
        Assert.Equal("🐺", mine.Emoji);
    }

    private async Task SeedMarkusHistoryAsync(Guid chefId, int dayBase)
    {
        // Anchor on the fixed test clock so the staggered instants stay inside the 90-day tier
        // window the server measures from the same clock.
        var now = FixedTimeProvider.Instant;
        await SeedAsync(database =>
        {
            var dayOffset = 0;
            foreach (var (productId, meat, sauces) in MarkusHistory)
            {
                // Stagger the OccurredOn instants a few days apart so every order lands inside the
                // rolling 90-day window; each OrderDay gets its own unique Date (dayBase keeps two
                // tests in the same class from colliding on the unique OrderDay.Date index).
                var occurredOn = now.AddDays(-dayOffset);
                var dayDate = new DateOnly(2000, 1, 1).AddDays(dayBase + dayOffset);
                var day = new OrderDay
                {
                    Id = Guid.NewGuid(),
                    Date = dayDate,
                    Status = OrderDayStatus.Closed,
                    Synonym = "Drehspieß-Tasche",
                    OrderCutoffAt = occurredOn,
                    OpenedByUserId = chefId,
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
                        UserId = chefId,
                        IsPickup = false,
                        OccurredOn = occurredOn,
                        CreatedAt = occurredOn,
                        UpdatedAt = occurredOn,
                        Lines = new List<OrderLine>
                        {
                            new()
                            {
                                Id = Guid.NewGuid(),
                                OrderId = orderId,
                                ProductId = productId,
                                Kind =
                                    productId == "pizza" ? ProductKind.Pizza : ProductKind.Doener,
                                Meat = meat,
                                PizzaVariant = null,
                                Sauces = sauces,
                                PriceCents = 800,
                                Extra = null,
                                Quantity = 1,
                            },
                        },
                    }
                );
                // A settled debt so the order counts under the fail-safe stats rule (day closed AND,
                // for a non-pickup order, its debt settled).
                database.Debts.Add(
                    new Debt
                    {
                        Id = Guid.NewGuid(),
                        DebtorUserId = chefId,
                        CreditorUserId = chefId,
                        OrderId = orderId,
                        OrderDayId = day.Id,
                        AmountCents = 800,
                        Reason = "Döner-Tag",
                        Status = PaymentStatus.Settled,
                        CreatedAt = occurredOn,
                        SettledAt = occurredOn,
                    }
                );
                dayOffset++;
            }
        });
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
