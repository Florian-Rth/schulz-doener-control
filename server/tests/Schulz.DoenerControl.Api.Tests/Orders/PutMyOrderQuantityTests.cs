using System.Net;
using System.Net.Http.Json;
using Schulz.DoenerControl.Api.Endpoints.Orders;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Orders;

// Quantity math lives in its own class so it gets a fresh DB (the upsert/cutoff test pushes the
// shared day's cutoff into the past). A single line with quantity 2 yields a line total — and an
// order total — of 2 * the per-unit price.
public sealed class PutMyOrderQuantityTests : DoenerControlTestBase
{
    public PutMyOrderQuantityTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Multiply_Line_Total_By_Quantity()
    {
        var auth = await OrderTestHelpers.LoginAsChefAsync(App);
        var dayId = await OrderTestHelpers.OpenTodayAsync(auth);

        var response = await auth.PutJsonAsync(
            $"/api/order-days/{dayId}/orders/mine",
            OrderTestHelpers.DoenerBody(priceCents: 750, quantity: 2)
        );

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var order = await response.Content.ReadFromJsonAsync<OrderDetailsDto>(
            TestContext.Current.CancellationToken
        );
        Assert.NotNull(order);
        var line = Assert.Single(order!.Lines);
        Assert.Equal(2, line.Quantity);
        Assert.Equal(750, line.PriceCents);
        Assert.Equal(1500, line.LineTotalCents);
        Assert.Equal(1500, order.PriceCents);
    }
}
