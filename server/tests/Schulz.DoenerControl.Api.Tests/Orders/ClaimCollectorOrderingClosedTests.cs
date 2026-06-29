using System.Net;
using Schulz.DoenerControl.Api.Tests.Auth;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Orders;

// Pay-link gating: once the collector closes ordering, the Abholer is locked in. A late take-over
// must be rejected so the collector identity can no longer churn after the pickup is committed to.
// (Take-over WHILE ordering is still open stays allowed — covered by ClaimCollectorTests.)
public sealed class ClaimCollectorOrderingClosedTests : DoenerControlTestBase
{
    public ClaimCollectorOrderingClosedTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Return_Conflict_When_Ordering_Already_Closed()
    {
        // Chef opens and orders as pickup (auto-becomes collector). A colleague orders while ordering
        // is still open. The collector then closes ordering — after which the colleague's take-over
        // attempt must 409.
        var chef = await OrderTestHelpers.LoginAsChefAsync(App);
        var dayId = await OrderTestHelpers.OpenTodayAsync(chef);
        await chef.PutJsonAsync(
            $"/api/order-days/{dayId}/orders/mine",
            OrderTestHelpers.DoenerBody(isPickup: true)
        );

        var colleague = await OrderTestHelpers.LoginAsColleagueAsync(
            App,
            "l.brandt",
            "kollegePw11"
        );
        await colleague.PutJsonAsync(
            $"/api/order-days/{dayId}/orders/mine",
            OrderTestHelpers.DoenerBody(isPickup: false)
        );

        var closeOrdering = await chef.PostAsync($"/api/order-days/{dayId}/close-ordering");
        Assert.Equal(HttpStatusCode.OK, closeOrdering.StatusCode);

        var claim = await colleague.PostAsync($"/api/order-days/{dayId}/collector/claim");

        Assert.Equal(HttpStatusCode.Conflict, claim.StatusCode);
    }
}
