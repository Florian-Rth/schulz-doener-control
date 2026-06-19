using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Schulz.DoenerControl.Api.Tests.Auth;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Core.Enums;
using Schulz.DoenerControl.Infrastructure.Persistence;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Admin;

// Shared helpers for the admin menu-management integration tests: the admin/employee logins reuse
// the user-management helpers, and these add DbContext reads/writes the menu scenarios assert on.
internal static class AdminMenuTestHelpers
{
    public const string MenuUrl = "/api/admin/menu";

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    public static async Task<MenuItem?> FindMenuItemAsync(DoenerControlApp app, string id)
    {
        using var scope = app.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return await database
            .MenuItems.AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == id, Ct);
    }

    public static async Task<int> MenuItemCountAsync(DoenerControlApp app)
    {
        using var scope = app.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return await database.MenuItems.CountAsync(Ct);
    }

    // Inserts one order referencing the given menu item so the soft-retire path has a real FK to
    // protect. Uses the first seeded user and a throwaway open order day.
    public static async Task<Guid> SeedOrderReferencingAsync(DoenerControlApp app, string productId)
    {
        using var scope = app.Services.CreateScope();
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

        var orderId = Guid.NewGuid();
        var order = new Order
        {
            Id = orderId,
            OrderDayId = day.Id,
            UserId = user.Id,
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
                    ProductId = productId,
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
        database.Orders.Add(order);
        await database.SaveChangesAsync(Ct);
        return order.Id;
    }
}
