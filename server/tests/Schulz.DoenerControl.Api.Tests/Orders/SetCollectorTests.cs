using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Schulz.DoenerControl.Api.Endpoints.Orders;
using Schulz.DoenerControl.Api.Tests.Auth;
using Schulz.DoenerControl.Infrastructure.Persistence;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Orders;

public sealed class SetCollectorTests : DoenerControlTestBase
{
    public SetCollectorTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Return_Unauthorized_When_Not_Authenticated()
    {
        var auth = new AuthTestClient(App.CreateClient());

        var response = await auth.PostJsonAsync(
            $"/api/order-days/{Guid.NewGuid()}/collector",
            new { CollectorUserId = Guid.NewGuid() }
        );

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Should_Reject_When_Designated_User_Is_Not_A_Pickup()
    {
        // Designate a colleague who ordered as a NON-pickup → rejected. Targeting a distinct user
        // keeps this independent of the chef's pickup flag (tests in a class share one open day).
        var chef = await OrderTestHelpers.LoginAsChefAsync(App);
        var dayId = await OrderTestHelpers.OpenTodayAsync(chef);
        var colleague = await OrderTestHelpers.LoginAsColleagueAsync(App, "t.klein", "kollegePw33");
        await colleague.PutJsonAsync(
            $"/api/order-days/{dayId}/orders/mine",
            OrderTestHelpers.DoenerBody(isPickup: false)
        );
        var colleagueId = await OrderTestHelpers.UserIdByUsernameAsync(App, "t.klein");

        var response = await chef.PostJsonAsync(
            $"/api/order-days/{dayId}/collector",
            new { CollectorUserId = colleagueId }
        );

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Should_Designate_Collector_When_User_Is_A_Pickup()
    {
        var auth = await OrderTestHelpers.LoginAsChefAsync(App);
        var dayId = await OrderTestHelpers.OpenTodayAsync(auth);
        await auth.PutJsonAsync(
            $"/api/order-days/{dayId}/orders/mine",
            OrderTestHelpers.DoenerBody(isPickup: true)
        );
        var chefId = await OrderTestHelpers.UserIdByUsernameAsync(App, "m.wagner");

        var response = await auth.PostJsonAsync(
            $"/api/order-days/{dayId}/collector",
            new { CollectorUserId = chefId }
        );
        var body = await response.Content.ReadFromJsonAsync<SetCollectorResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.Equal("Open", body!.Day.Status);

        using var scope = App.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var day = await database.OrderDays.SingleAsync(
            d => d.Id == dayId,
            TestContext.Current.CancellationToken
        );
        Assert.Equal(chefId, day.CollectorUserId);
    }
}
