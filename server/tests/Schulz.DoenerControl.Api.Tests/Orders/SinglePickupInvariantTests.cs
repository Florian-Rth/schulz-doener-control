using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Schulz.DoenerControl.Api.Endpoints.Orders;
using Schulz.DoenerControl.Api.Tests.Auth;
using Schulz.DoenerControl.Infrastructure.Persistence;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Orders;

// The invariant: at most ONE Order.IsPickup=true per OrderDay. Every write path that sets a pickup
// must demote every other order of that day in the same SaveChanges, and the filtered unique index
// is the hard backstop. Regression for: multiple colleagues set themselves Abholer → at close every
// pickup wrongly dropped out of the debtor set.
public sealed class SinglePickupInvariantTests : DoenerControlTestBase
{
    public SinglePickupInvariantTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Leave_Exactly_One_Pickup_When_New_Pickup_Claims()
    {
        // Three participants, one of whom is already the pickup. A different one claims collector —
        // the designator must collapse to a single pickup (the new claimant), never two.
        var chef = await OrderTestHelpers.LoginAsChefAsync(App);
        var dayId = await OrderTestHelpers.OpenTodayAsync(chef);
        await chef.PutJsonAsync(
            $"/api/order-days/{dayId}/orders/mine",
            OrderTestHelpers.DoenerBody(isPickup: true)
        );
        await chef.PostAsync($"/api/order-days/{dayId}/collector/claim");

        var lukas = await OrderTestHelpers.LoginAsColleagueAsync(App, "l.brandt", "kollegePw11");
        await lukas.PutJsonAsync(
            $"/api/order-days/{dayId}/orders/mine",
            OrderTestHelpers.DoenerBody(isPickup: false)
        );

        var sara = await OrderTestHelpers.LoginAsColleagueAsync(App, "s.yilmaz", "kollegePw22");
        await sara.PutJsonAsync(
            $"/api/order-days/{dayId}/orders/mine",
            OrderTestHelpers.DoenerBody(isPickup: false)
        );
        var saraId = await OrderTestHelpers.UserIdByUsernameAsync(App, "s.yilmaz");

        var response = await sara.PostAsync($"/api/order-days/{dayId}/collector/claim");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(1, await CountPickupsAsync(dayId));
        Assert.Equal(new[] { saraId }, await PickupUserIdsAsync(dayId));
    }

    [Fact]
    public async Task Should_Clear_Previous_Collector_And_Leave_One_Pickup_When_Taking_Over()
    {
        // Chef is the pickup/collector; a colleague takes over. Only the colleague stays a pickup; the
        // ex-collector is demoted (re-enters the debtor set) and the collector designation follows.
        var chef = await OrderTestHelpers.LoginAsChefAsync(App);
        var dayId = await OrderTestHelpers.OpenTodayAsync(chef);
        await chef.PutJsonAsync(
            $"/api/order-days/{dayId}/orders/mine",
            OrderTestHelpers.DoenerBody(isPickup: true)
        );
        await chef.PostAsync($"/api/order-days/{dayId}/collector/claim");
        var chefId = await OrderTestHelpers.UserIdByUsernameAsync(App, "m.wagner");

        var lukas = await OrderTestHelpers.LoginAsColleagueAsync(App, "l.brandt", "kollegePw11");
        await lukas.PutJsonAsync(
            $"/api/order-days/{dayId}/orders/mine",
            OrderTestHelpers.DoenerBody(isPickup: false)
        );
        var lukasId = await OrderTestHelpers.UserIdByUsernameAsync(App, "l.brandt");

        var response = await lukas.PostAsync($"/api/order-days/{dayId}/collector/claim");
        var body = await response.Content.ReadFromJsonAsync<ClaimCollectorResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True(body!.Day.AmICollector);
        Assert.Equal(1, await CountPickupsAsync(dayId));
        Assert.Equal(new[] { lukasId }, await PickupUserIdsAsync(dayId));

        using var scope = App.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var day = await database.OrderDays.SingleAsync(
            d => d.Id == dayId,
            TestContext.Current.CancellationToken
        );
        Assert.Equal(lukasId, day.CollectorUserId);
        var chefOrder = await database.Orders.SingleAsync(
            order => order.OrderDayId == dayId && order.UserId == chefId,
            TestContext.Current.CancellationToken
        );
        Assert.False(chefOrder.IsPickup);
    }

    [Fact]
    public async Task Should_Clear_Another_Participants_Pickup_When_Placing_Pickup_Order()
    {
        // Chef is the pickup. A colleague then PLACES their order with isPickup=true — the upsert path
        // must demote the chef so the colleague becomes the sole pickup.
        var chef = await OrderTestHelpers.LoginAsChefAsync(App);
        var dayId = await OrderTestHelpers.OpenTodayAsync(chef);
        await chef.PutJsonAsync(
            $"/api/order-days/{dayId}/orders/mine",
            OrderTestHelpers.DoenerBody(isPickup: true)
        );
        var chefId = await OrderTestHelpers.UserIdByUsernameAsync(App, "m.wagner");

        var lukas = await OrderTestHelpers.LoginAsColleagueAsync(App, "l.brandt", "kollegePw11");
        var response = await lukas.PutJsonAsync(
            $"/api/order-days/{dayId}/orders/mine",
            OrderTestHelpers.DoenerBody(isPickup: true)
        );
        var lukasId = await OrderTestHelpers.UserIdByUsernameAsync(App, "l.brandt");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(1, await CountPickupsAsync(dayId));
        Assert.Equal(new[] { lukasId }, await PickupUserIdsAsync(dayId));

        using var scope = App.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var chefOrder = await database.Orders.SingleAsync(
            order => order.OrderDayId == dayId && order.UserId == chefId,
            TestContext.Current.CancellationToken
        );
        Assert.False(chefOrder.IsPickup);
    }

    private async Task<int> CountPickupsAsync(Guid orderDayId)
    {
        using var scope = App.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return await database.Orders.CountAsync(
            order => order.OrderDayId == orderDayId && order.IsPickup,
            TestContext.Current.CancellationToken
        );
    }

    private async Task<IReadOnlyList<Guid>> PickupUserIdsAsync(Guid orderDayId)
    {
        using var scope = App.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return await database
            .Orders.Where(order => order.OrderDayId == orderDayId && order.IsPickup)
            .Select(order => order.UserId)
            .ToListAsync(TestContext.Current.CancellationToken);
    }
}
