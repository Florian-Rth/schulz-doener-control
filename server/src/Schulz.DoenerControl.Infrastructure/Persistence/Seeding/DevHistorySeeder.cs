using Microsoft.EntityFrameworkCore;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Infrastructure.Persistence.Seeding;

// Development-only history seed: reproduces the Chef's exact 12-order MY_HISTORY from the
// mock so the seeded admin's computed Doener-Tier matches the mock (🐺 Der Knoblauch-Wolf), and
// gives the dashboard/leaderboard realistic non-empty data. The orders are attributed to the
// single seeded admin (the dev "Chef"). Never runs in Testing or Production — tests build their
// own minimal fixtures. Lines now carry the generic Answers payload (meat/sauce option keys) rather
// than the retired typed columns; the tier projection reads it back identically.
public sealed class DevHistorySeeder
{
    // The Chef's last-3-months history, copied verbatim from the mock's MY_HISTORY array. Meat/sauce
    // are expressed as the reserved option keys the answers payload stores.
    private static readonly (string ProductId, string Meat, string[] Sauces)[] ChefHistory = new[]
    {
        ("doener", "kalb", new[] { "knoblauch", "kraeuter" }),
        ("doener", "kalb", new[] { "knoblauch", "scharf" }),
        ("duerum", "kalb", new[] { "knoblauch", "kraeuter", "scharf" }),
        ("doener", "kalb", new[] { "knoblauch" }),
        ("big", "kalb", new[] { "knoblauch", "scharf" }),
        ("doener", "haehnchen", new[] { "knoblauch", "kraeuter" }),
        ("box", "kalb", new[] { "knoblauch" }),
        ("doener", "kalb", new[] { "kraeuter" }),
        ("doener", "kalb", new[] { "knoblauch", "scharf" }),
        ("duerum", "kalb", new[] { "knoblauch", "kraeuter" }),
        ("doener", "kalb", new[] { "knoblauch", "scharf" }),
        ("doener", "kalb", new[] { "knoblauch" }),
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
        var storeId = await database
            .Stores.AsNoTracking()
            .OrderBy(store => store.SortOrder)
            .Select(store => (Guid?)store.Id)
            .FirstOrDefaultAsync(ct);

        var now = timeProvider.GetUtcNow();
        var weekStart = now.AddDays(-7 * ChefHistory.Length);

        for (var index = 0; index < ChefHistory.Length; index++)
        {
            var occurredOn = weekStart.AddDays(7 * index);
            var (productId, meat, sauces) = ChefHistory[index];

            var day = new OrderDay
            {
                Id = Guid.NewGuid(),
                StoreId = storeId,
                Date = DateOnly.FromDateTime(occurredOn.UtcDateTime),
                Status = OrderDayStatus.Closed,
                Synonym = "Drehspieß-Tasche",
                OrderCutoffAt = occurredOn,
                OpenedByUserId = chef.Id,
                OpenedAt = occurredOn,
                ClosedAt = occurredOn.AddHours(3),
            };
            database.OrderDays.Add(day);

            var orderId = Guid.NewGuid();
            database.Orders.Add(
                new Order
                {
                    Id = orderId,
                    OrderDayId = day.Id,
                    UserId = chef.Id,
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
                            Answers = BuildAnswers(meat, sauces),
                            PriceCents = priceByProduct.GetValueOrDefault(productId, 0),
                            Quantity = 1,
                        },
                    },
                }
            );
        }

        await database.SaveChangesAsync(ct);
    }

    private static LineAnswers BuildAnswers(string meat, string[] sauces) =>
        new(
            new Dictionary<string, AnswerValue>
            {
                ["meat"] = AnswerValue.FromOptions(meat),
                ["sauce"] = AnswerValue.FromOptions(sauces),
            }
        );
}
