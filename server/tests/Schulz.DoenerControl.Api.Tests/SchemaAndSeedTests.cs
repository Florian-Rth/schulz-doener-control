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
        Assert.NotNull(danny.CategoryId);
        // Danny is a preset that prints as its base Dönerbox.
        Assert.Equal("box", danny.BaseItemId);
        Assert.NotNull(danny.DefaultAnswers);

        var pizza = menu.Single(item => item.Id == "pizza");
        Assert.NotNull(pizza.CategoryId);
        Assert.Equal(900, pizza.DefaultPriceCents);

        // The canonical seed is all available; the public order form shows the full six.
        Assert.All(menu, item => Assert.True(item.IsAvailable));
    }

    [Fact]
    public async Task Should_Seed_Generic_Categories_And_Fields_When_Migration_Applied()
    {
        using var scope = App.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var categories = await database
            .Categories.OrderBy(category => category.SortOrder)
            .Select(category => category.Key)
            .ToListAsync(Ct);
        Assert.Equal(new[] { "doener", "doenerbox", "pizza" }, categories.ToArray());

        var variantField = await database
            .FieldDefinitions.Include(field => field.Options)
            .SingleAsync(field => field.Key == "variant", Ct);
        Assert.Equal(
            new[] { "margherita", "funghi", "salami", "tonno", "hawaii" },
            variantField
                .Options!.OrderBy(option => option.SortOrder)
                .Select(option => option.Key)
                .ToArray()
        );

        // The reserved meat/sauce fields the Tier contract depends on exist.
        Assert.True(await database.FieldDefinitions.AnyAsync(field => field.Key == "meat", Ct));
        Assert.True(await database.FieldDefinitions.AnyAsync(field => field.Key == "sauce", Ct));
    }

    [Fact]
    public async Task Should_Seed_Standard_NotificationTemplates_When_Migration_Applied()
    {
        using var scope = App.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var templates = await database.NotificationTemplates.ToListAsync(Ct);

        Assert.Equal(
            Infrastructure.Persistence.Seeding.NotificationTemplateSeeder.CanonicalTemplates.Count,
            templates.Count
        );
        Assert.All(templates, template => Assert.True(template.IsActive));
        Assert.All(templates, template => Assert.False(string.IsNullOrWhiteSpace(template.Body)));
        Assert.Contains(templates, template => template.Synonym == "Drehspieß-Tasche");
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
    public async Task Should_Roundtrip_Answers_Json_When_Order_Persisted()
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
        order.Lines.Single().Answers = TestAnswers.Build(
            "kalb",
            ["knoblauch", "scharf"],
            null,
            "ohne Zwiebeln"
        );
        database.Orders.Add(order);
        await database.SaveChangesAsync(Ct);
        database.ChangeTracker.Clear();

        var stored = await database
            .Orders.Include(o => o.Lines)
            .SingleAsync(o => o.Id == order.Id, Ct);
        var answers = stored.Lines.Single().Answers;

        Assert.Equal(["kalb"], answers.OptionsFor("meat"));
        Assert.Equal(["knoblauch", "scharf"], answers.OptionsFor("sauce"));
        Assert.Equal("ohne Zwiebeln", answers.TextFor("extra"));
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
                    Answers = TestAnswers.Doener("kalb", "knoblauch"),
                    PriceCents = 750,
                    Quantity = 1,
                },
            },
        };
    }
}
