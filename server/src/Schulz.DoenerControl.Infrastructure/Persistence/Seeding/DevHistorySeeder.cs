using Microsoft.EntityFrameworkCore;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Infrastructure.Persistence.Seeding;

// Development-only history seed: reproduces the Chef's exact 12-order MY_HISTORY from the
// mock so the seeded admin's computed Doener-Tier matches the mock (🐺 Der Knoblauch-Wolf), and
// gives the dashboard/leaderboard realistic non-empty data. The orders are attributed to the
// single seeded admin (the dev "Chef"). Never runs in Testing or Production — tests build their
// own minimal fixtures.
public sealed class DevHistorySeeder
{
    // The Chef's last-3-months history, copied verbatim from the mock's MY_HISTORY array.
    private static readonly (
        string ProductId,
        ProductKind Kind,
        MeatType Meat,
        Sauce Sauces
    )[] ChefHistory = new[]
    {
        ("doener", ProductKind.Doener, MeatType.Kalb, Sauce.Knoblauch | Sauce.Kraeuter),
        ("doener", ProductKind.Doener, MeatType.Kalb, Sauce.Knoblauch | Sauce.Scharf),
        (
            "duerum",
            ProductKind.Doener,
            MeatType.Kalb,
            Sauce.Knoblauch | Sauce.Kraeuter | Sauce.Scharf
        ),
        ("doener", ProductKind.Doener, MeatType.Kalb, Sauce.Knoblauch),
        ("big", ProductKind.Doener, MeatType.Kalb, Sauce.Knoblauch | Sauce.Scharf),
        ("doener", ProductKind.Doener, MeatType.Haehnchen, Sauce.Knoblauch | Sauce.Kraeuter),
        ("box", ProductKind.Doener, MeatType.Kalb, Sauce.Knoblauch),
        ("doener", ProductKind.Doener, MeatType.Kalb, Sauce.Kraeuter),
        ("doener", ProductKind.Doener, MeatType.Kalb, Sauce.Knoblauch | Sauce.Scharf),
        ("duerum", ProductKind.Doener, MeatType.Kalb, Sauce.Knoblauch | Sauce.Kraeuter),
        ("doener", ProductKind.Doener, MeatType.Kalb, Sauce.Knoblauch | Sauce.Scharf),
        ("doener", ProductKind.Doener, MeatType.Kalb, Sauce.Knoblauch),
    };

    private readonly AppDbContext database;
    private readonly TimeProvider timeProvider;

    public DevHistorySeeder(AppDbContext database, TimeProvider timeProvider)
    {
        this.database = database;
        this.timeProvider = timeProvider;
    }

    public async Task SeedAsync(CancellationToken ct)
    {
        if (await database.OrderDays.AnyAsync(ct))
        {
            return;
        }

        var chef = await database.Users.FirstOrDefaultAsync(
            user => user.Role == UserRole.Admin,
            ct
        );
        if (chef is null)
        {
            return;
        }

        var priceByProduct = await database.MenuItems.ToDictionaryAsync(
            item => item.Id,
            item => item.DefaultPriceCents,
            ct
        );

        var now = timeProvider.GetUtcNow();
        var weekStart = now.AddDays(-7 * ChefHistory.Length);

        for (var index = 0; index < ChefHistory.Length; index++)
        {
            var occurredOn = weekStart.AddDays(7 * index);
            var (productId, kind, meat, sauces) = ChefHistory[index];

            var day = new OrderDay
            {
                Id = Guid.NewGuid(),
                Date = DateOnly.FromDateTime(occurredOn.UtcDateTime),
                Status = OrderDayStatus.Closed,
                Synonym = "Drehspieß-Tasche",
                OrderCutoffAt = occurredOn,
                OpenedByUserId = chef.Id,
                OpenedAt = occurredOn,
                ClosedAt = occurredOn.AddHours(3),
            };
            database.OrderDays.Add(day);

            database.Orders.Add(
                new Order
                {
                    Id = Guid.NewGuid(),
                    OrderDayId = day.Id,
                    UserId = chef.Id,
                    ProductId = productId,
                    Kind = kind,
                    Meat = meat,
                    PizzaVariant = null,
                    Sauces = sauces,
                    PriceCents = priceByProduct.GetValueOrDefault(productId, 0),
                    Extra = null,
                    IsPickup = false,
                    OccurredOn = occurredOn,
                    CreatedAt = occurredOn,
                    UpdatedAt = occurredOn,
                }
            );
        }

        await database.SaveChangesAsync(ct);
    }
}
