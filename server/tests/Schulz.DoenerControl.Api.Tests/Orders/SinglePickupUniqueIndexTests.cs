using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Core.Enums;
using Schulz.DoenerControl.Infrastructure.Persistence;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Orders;

// The hard backstop: the filtered unique index forbids two IsPickup=true rows on one OrderDay even if
// a future code path forgot to demote. Builds its own day directly so no other test's pickup shares
// it; own fresh DB per class (the harness isolates per class).
public sealed class SinglePickupUniqueIndexTests : DoenerControlTestBase
{
    public SinglePickupUniqueIndexTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Reject_Second_Pickup_Row_For_Same_Day()
    {
        using var scope = App.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var chefId = await database
            .Users.Where(user => user.NormalizedUserName == "m.wagner")
            .Select(user => user.Id)
            .SingleAsync(TestContext.Current.CancellationToken);
        var lukasId = await database
            .Users.Where(user => user.NormalizedUserName == "l.brandt")
            .Select(user => user.Id)
            .SingleAsync(TestContext.Current.CancellationToken);

        var day = BuildOpenDay(chefId, new DateOnly(2032, 5, 6));
        database.OrderDays.Add(day);
        database.Orders.Add(BuildPickupOrder(day.Id, chefId));
        await database.SaveChangesAsync(TestContext.Current.CancellationToken);

        // A second pickup on the same day must be rejected by the partial unique index.
        database.Orders.Add(BuildPickupOrder(day.Id, lukasId));

        await Assert.ThrowsAsync<DbUpdateException>(async () =>
            await database.SaveChangesAsync(TestContext.Current.CancellationToken)
        );
    }

    [Fact]
    public async Task Should_Allow_Many_Non_Pickup_Rows_For_Same_Day()
    {
        // The filter means non-pickup orders are unconstrained: a day can have many.
        using var scope = App.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var chefId = await database
            .Users.Where(user => user.NormalizedUserName == "m.wagner")
            .Select(user => user.Id)
            .SingleAsync(TestContext.Current.CancellationToken);
        var lukasId = await database
            .Users.Where(user => user.NormalizedUserName == "l.brandt")
            .Select(user => user.Id)
            .SingleAsync(TestContext.Current.CancellationToken);

        var day = BuildOpenDay(chefId, new DateOnly(2032, 5, 7));
        database.OrderDays.Add(day);
        database.Orders.Add(BuildOrder(day.Id, chefId, isPickup: false));
        database.Orders.Add(BuildOrder(day.Id, lukasId, isPickup: false));

        await database.SaveChangesAsync(TestContext.Current.CancellationToken);

        var count = await database.Orders.CountAsync(
            order => order.OrderDayId == day.Id,
            TestContext.Current.CancellationToken
        );
        Assert.Equal(2, count);
    }

    private static OrderDay BuildOpenDay(Guid openedByUserId, DateOnly date) =>
        new()
        {
            Id = Guid.NewGuid(),
            Date = date,
            Status = OrderDayStatus.Open,
            Synonym = "Drehspieß-Tasche",
            OrderCutoffAt = DateTimeOffset.UnixEpoch,
            OpenedByUserId = openedByUserId,
            OpenedAt = DateTimeOffset.UnixEpoch,
            ClosedAt = null,
            CollectorUserId = null,
        };

    private static Order BuildPickupOrder(Guid orderDayId, Guid userId) =>
        BuildOrder(orderDayId, userId, isPickup: true);

    private static Order BuildOrder(Guid orderDayId, Guid userId, bool isPickup) =>
        new()
        {
            Id = Guid.NewGuid(),
            OrderDayId = orderDayId,
            UserId = userId,
            IsPickup = isPickup,
            OccurredOn = DateTimeOffset.UnixEpoch,
            CreatedAt = DateTimeOffset.UnixEpoch,
            UpdatedAt = DateTimeOffset.UnixEpoch,
        };
}
