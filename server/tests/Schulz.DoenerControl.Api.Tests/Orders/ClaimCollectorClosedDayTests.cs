using System.Net;
using Schulz.DoenerControl.Api.Tests.Auth;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Orders;

// Own fresh DB: this scenario closes the day, so it must not share the open day the other
// ClaimCollector tests act on (one day per calendar date per DB).
public sealed class ClaimCollectorClosedDayTests : DoenerControlTestBase
{
    public ClaimCollectorClosedDayTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Return_Conflict_When_Day_Is_Closed()
    {
        // The chef orders, claims collector, then closes the day (only the collector may close). A
        // later claim on the now-closed day is rejected with 409.
        var chef = await OrderTestHelpers.LoginAsChefAsync(App);
        var dayId = await OrderTestHelpers.OpenTodayAsync(chef);
        await chef.PutJsonAsync(
            $"/api/order-days/{dayId}/orders/mine",
            OrderTestHelpers.DoenerBody(isPickup: true)
        );
        await chef.PostAsync($"/api/order-days/{dayId}/collector/claim");
        await chef.PostAsync($"/api/order-days/{dayId}/close");

        var response = await chef.PostAsync($"/api/order-days/{dayId}/collector/claim");

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }
}
