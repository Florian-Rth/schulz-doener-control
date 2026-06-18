using System.Net;
using System.Net.Http.Json;
using Schulz.DoenerControl.Api.Endpoints.Orders;
using Schulz.DoenerControl.Api.Tests.Auth;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Orders;

// The success-screen summary, server-driven from one order id. Exercises both branches against the
// real DB: a non-pickup payer sees the Abholer + their PayPal deep-link; the designated collector
// sees the total they collect from the non-pickup colleagues.
public sealed class GetOrderResultTests : DoenerControlTestBase
{
    public GetOrderResultTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Return_Unauthorized_When_Not_Authenticated()
    {
        var auth = new AuthTestClient(App.CreateClient());

        var response = await auth.GetAsync($"/api/orders/{Guid.NewGuid()}/result");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Should_Return_NotFound_When_Order_Is_Not_Callers()
    {
        var auth = await OrderTestHelpers.LoginAsChefAsync(App);

        var response = await auth.GetAsync($"/api/orders/{Guid.NewGuid()}/result");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Should_Expose_PayBranch_For_Payer_And_CollectBranch_For_Collector()
    {
        // Chef opens the day, orders, claims pickup, and is designated the single collector.
        var chef = await OrderTestHelpers.LoginAsChefAsync(App);
        var dayId = await OrderTestHelpers.OpenTodayAsync(chef);
        var chefOrder = await chef.PutJsonAsync(
            $"/api/order-days/{dayId}/orders/mine",
            OrderTestHelpers.DoenerBody(priceCents: 950, isPickup: true)
        );
        var chefOrderId = (
            await chefOrder.Content.ReadFromJsonAsync<PutMyOrderResponse>(
                TestContext.Current.CancellationToken
            )
        )!
            .Order
            .Id;
        var chefId = await OrderTestHelpers.UserIdByUsernameAsync(App, "m.wagner");
        await chef.PostJsonAsync(
            $"/api/order-days/{dayId}/collector",
            new { CollectorUserId = chefId }
        );

        // A colleague orders as a non-pickup payer.
        var colleague = await OrderTestHelpers.LoginAsColleagueAsync(
            App,
            "l.brandt",
            "kollegePw88"
        );
        var colleagueOrder = await colleague.PutJsonAsync(
            $"/api/order-days/{dayId}/orders/mine",
            OrderTestHelpers.DoenerBody(productId: "duerum", meat: "Haehnchen", priceCents: 800)
        );
        var colleagueOrderId = (
            await colleagueOrder.Content.ReadFromJsonAsync<PutMyOrderResponse>(
                TestContext.Current.CancellationToken
            )
        )!
            .Order
            .Id;

        // PAY branch: the colleague owes the chef (Abholer) their own 8,00 € → PayPal deep-link.
        var payResponse = await colleague.GetAsync($"/api/orders/{colleagueOrderId}/result");
        var pay = await payResponse.Content.ReadFromJsonAsync<GetOrderResultResponse>(
            TestContext.Current.CancellationToken
        );
        Assert.Equal(HttpStatusCode.OK, payResponse.StatusCode);
        Assert.NotNull(pay);
        Assert.False(pay!.IsPickup);
        Assert.NotNull(pay.Abholer);
        Assert.Equal("Markus Wagner", pay.Abholer!.Name);
        Assert.Equal("MarkusWagnerHB", pay.Abholer.PayPalHandle);
        Assert.Equal("https://paypal.me/MarkusWagnerHB/8.00EUR", pay.MyPayPalUrl);
        Assert.Equal(0, pay.CollectCents);

        // COLLECT branch: the chef collects the colleague's 8,00 € from one non-pickup payer.
        var collectResponse = await chef.GetAsync($"/api/orders/{chefOrderId}/result");
        var collect = await collectResponse.Content.ReadFromJsonAsync<GetOrderResultResponse>(
            TestContext.Current.CancellationToken
        );
        Assert.Equal(HttpStatusCode.OK, collectResponse.StatusCode);
        Assert.NotNull(collect);
        Assert.True(collect!.IsPickup);
        Assert.Equal(800, collect.CollectCents);
        Assert.Equal(1, collect.CollectCount);
        Assert.Null(collect.MyPayPalUrl);
    }
}
