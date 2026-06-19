using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Core.Enums;
using Schulz.DoenerControl.Infrastructure.Persistence;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests;

// Exercises the real migrations applied to a fresh SQLite database by the harness, plus the menu
// reference seed (now planted at runtime by MenuSeeder, not HasData) and the explicit test-account
// cast the harness seeds. Asserts the menu and users are present and that the schema's unique
// constraints actually fire on real inserts.
public sealed class SchemaAndSeedTests : DoenerControlTestBase
{
    public SchemaAndSeedTests(DoenerControlApp app)
        : base(app) { }

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Should_Seed_Six_Menu_Items_When_Migration_Applied()
    {
        using var scope = App.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var menu = await database.MenuItems.OrderBy(item => item.SortOrder).ToListAsync(Ct);

        Assert.Equal(6, menu.Count);
        Assert.Equal(
            new[] { "doener", "duerum", "big", "box", "danny", "pizza" },
            menu.Select(item => item.Id).ToArray()
        );

        var danny = menu.Single(item => item.Id == "danny");
        Assert.True(danny.IsInsider);
        Assert.Equal(600, danny.DefaultPriceCents);
        Assert.Equal(ProductKind.Doener, danny.Kind);

        var pizza = menu.Single(item => item.Id == "pizza");
        Assert.Equal(ProductKind.Pizza, pizza.Kind);
        Assert.Equal(900, pizza.DefaultPriceCents);

        // The canonical seed is all available; the public order form shows the full six.
        Assert.All(menu, item => Assert.True(item.IsAvailable));
    }

    [Fact]
    public async Task Should_Seed_Active_TestUsers_With_Real_Credentials()
    {
        using var scope = App.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var users = await database.Users.ToListAsync(Ct);

        Assert.NotEmpty(users);
        Assert.All(users, user => Assert.True(user.IsActive));
        Assert.All(users, user => Assert.NotEmpty(user.PasswordHash));
        Assert.All(users, user => Assert.NotEmpty(user.PasswordSalt));
        Assert.All(
            users,
            user => Assert.Equal(user.Username.ToLowerInvariant(), user.NormalizedUserName)
        );

        // Exactly one admin in the test cast — the verified "Chef".
        Assert.Single(users, user => user.Role == UserRole.Admin);
    }

    [Fact]
    public async Task Should_Seed_Verified_Chef_When_Migration_Applied()
    {
        using var scope = App.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var chef = await database.Users.SingleAsync(
            user => user.NormalizedUserName == TestSeeding.ChefUsername,
            Ct
        );

        Assert.False(chef.MustChangePassword);
        Assert.Equal(TestSeeding.ChefDisplayName, chef.DisplayName);
        Assert.Equal(UserRole.Admin, chef.Role);
    }

    [Fact]
    public async Task Should_Reject_Duplicate_NormalizedUserName_When_Inserted()
    {
        using var scope = App.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        database.Users.Add(
            new User
            {
                Id = Guid.NewGuid(),
                Username = "M.Wagner",
                NormalizedUserName = "m.wagner",
                DisplayName = "Doppelgaenger",
                PasswordHash = new byte[] { 1 },
                PasswordSalt = new byte[] { 1 },
                Role = UserRole.Employee,
                IsActive = true,
                MustChangePassword = true,
                AvatarColorHex = "#000000",
                CreatedAt = DateTimeOffset.UtcNow,
            }
        );

        await Assert.ThrowsAsync<DbUpdateException>(() => database.SaveChangesAsync(Ct));
    }

    [Fact]
    public async Task Should_Reject_Second_Order_For_Same_User_And_Day_When_Inserted()
    {
        using var scope = App.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var user = await database.Users.FirstAsync(Ct);
        var now = DateTimeOffset.UtcNow;
        var day = new OrderDay
        {
            Id = Guid.NewGuid(),
            Date = DateOnly.FromDateTime(now.UtcDateTime),
            Status = OrderDayStatus.Open,
            Synonym = "Klappkatze",
            OrderCutoffAt = now.AddHours(2),
            OpenedByUserId = user.Id,
            OpenedAt = now,
        };
        database.OrderDays.Add(day);
        await database.SaveChangesAsync(Ct);

        database.Orders.Add(BuildOrder(day.Id, user.Id, now));
        await database.SaveChangesAsync(Ct);

        database.Orders.Add(BuildOrder(day.Id, user.Id, now));

        await Assert.ThrowsAsync<DbUpdateException>(() => database.SaveChangesAsync(Ct));
    }

    [Fact]
    public async Task Should_Roundtrip_Sauce_Flags_When_Order_Persisted()
    {
        using var scope = App.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var user = await database.Users.FirstAsync(Ct);
        var now = DateTimeOffset.UtcNow;
        var day = new OrderDay
        {
            Id = Guid.NewGuid(),
            Date = DateOnly.FromDateTime(now.UtcDateTime).AddDays(-3),
            Status = OrderDayStatus.Open,
            Synonym = "Donatello",
            OrderCutoffAt = now.AddHours(2),
            OpenedByUserId = user.Id,
            OpenedAt = now,
        };
        database.OrderDays.Add(day);

        var order = BuildOrder(day.Id, user.Id, now);
        order.Lines.Single().Sauces = Sauce.Knoblauch | Sauce.Scharf;
        database.Orders.Add(order);
        await database.SaveChangesAsync(Ct);
        database.ChangeTracker.Clear();

        var stored = await database
            .Orders.Include(o => o.Lines)
            .SingleAsync(o => o.Id == order.Id, Ct);
        var storedSauces = stored.Lines.Single().Sauces;

        Assert.True((storedSauces & Sauce.Knoblauch) != 0);
        Assert.True((storedSauces & Sauce.Scharf) != 0);
        Assert.True((storedSauces & Sauce.Kraeuter) == 0);
    }

    private static Order BuildOrder(Guid orderDayId, Guid userId, DateTimeOffset now)
    {
        var orderId = Guid.NewGuid();
        return new Order
        {
            Id = orderId,
            OrderDayId = orderDayId,
            UserId = userId,
            IsPickup = false,
            OccurredOn = now,
            CreatedAt = now,
            UpdatedAt = now,
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
                    Sauces = Sauce.Knoblauch,
                    PriceCents = 750,
                    Extra = null,
                    Quantity = 1,
                },
            },
        };
    }
}
