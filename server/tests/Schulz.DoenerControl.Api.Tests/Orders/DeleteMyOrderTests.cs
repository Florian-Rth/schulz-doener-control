using System.Net;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Schulz.DoenerControl.Api.Tests.Auth;
using Schulz.DoenerControl.Infrastructure.Persistence;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Orders;

public sealed class DeleteMyOrderTests : DoenerControlTestBase
{
    public DeleteMyOrderTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Return_Unauthorized_When_Not_Authenticated()
    {
        var auth = new AuthTestClient(App.CreateClient());

        var response = await auth.DeleteAsync($"/api/order-days/{Guid.NewGuid()}/orders/mine");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Should_Return_NotFound_When_No_Order_To_Delete()
    {
        var auth = await OrderTestHelpers.LoginAsChefAsync(App);
        var dayId = await OrderTestHelpers.OpenTodayAsync(auth);

        var response = await auth.DeleteAsync($"/api/order-days/{dayId}/orders/mine");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Should_Withdraw_Order_When_Before_Cutoff()
    {
        var auth = await OrderTestHelpers.LoginAsChefAsync(App);
        var dayId = await OrderTestHelpers.OpenTodayAsync(auth);
        await auth.PutJsonAsync(
            $"/api/order-days/{dayId}/orders/mine",
            OrderTestHelpers.DoenerBody()
        );

        var response = await auth.DeleteAsync($"/api/order-days/{dayId}/orders/mine");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        using var scope = App.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var remaining = await database.Orders.CountAsync(
            order => order.OrderDayId == dayId,
            TestContext.Current.CancellationToken
        );
        Assert.Equal(0, remaining);
    }
}

// Withdrawing an order must reconcile the day's single Abholer: if the leaver was the designated
// collector, the designation is vacated so debt generation never references a non-participant.
// Own DB per class — the unique Date index fits one OrderDay.
public sealed class DeleteMyOrderCollectorTests : DoenerControlTestBase
{
    public DeleteMyOrderCollectorTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Clear_Collector_When_Collector_Removes_Own_Order()
    {
        var auth = await OrderTestHelpers.LoginAsChefAsync(App);
        var dayId = await OrderTestHelpers.OpenTodayAsync(auth);
        var chefId = await OrderTestHelpers.UserIdByUsernameAsync(App, "m.wagner");

        // Ordering as pickup auto-designates the chef as the day's collector.
        await auth.PutJsonAsync(
            $"/api/order-days/{dayId}/orders/mine",
            OrderTestHelpers.DoenerBody(isPickup: true)
        );
        await AssertCollectorAsync(dayId, chefId);

        var response = await auth.DeleteAsync($"/api/order-days/{dayId}/orders/mine");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
        await AssertCollectorAsync(dayId, null);
    }

    private async Task AssertCollectorAsync(Guid dayId, Guid? expected)
    {
        using var scope = App.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var day = await database.OrderDays.SingleAsync(
            d => d.Id == dayId,
            TestContext.Current.CancellationToken
        );
        Assert.Equal(expected, day.CollectorUserId);
    }
}

public sealed class DeleteMyOrderNonCollectorTests : DoenerControlTestBase
{
    public DeleteMyOrderNonCollectorTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Keep_Collector_When_Non_Collector_Removes_Order()
    {
        var chef = await OrderTestHelpers.LoginAsChefAsync(App);
        var dayId = await OrderTestHelpers.OpenTodayAsync(chef);
        var chefId = await OrderTestHelpers.UserIdByUsernameAsync(App, "m.wagner");
        await chef.PutJsonAsync(
            $"/api/order-days/{dayId}/orders/mine",
            OrderTestHelpers.DoenerBody(isPickup: true)
        );

        // A different colleague places a non-pickup order, then withdraws it.
        var lukas = await OrderTestHelpers.LoginAsColleagueAsync(App, "l.brandt", "kollegePw11");
        await lukas.PutJsonAsync(
            $"/api/order-days/{dayId}/orders/mine",
            OrderTestHelpers.DoenerBody(isPickup: false)
        );

        var response = await lukas.DeleteAsync($"/api/order-days/{dayId}/orders/mine");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        using var scope = App.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var day = await database.OrderDays.SingleAsync(
            d => d.Id == dayId,
            TestContext.Current.CancellationToken
        );
        Assert.Equal(chefId, day.CollectorUserId);
    }
}
