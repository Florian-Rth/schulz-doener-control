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
