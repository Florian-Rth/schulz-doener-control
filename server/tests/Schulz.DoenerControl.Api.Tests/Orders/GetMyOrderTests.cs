using System.Net;
using System.Net.Http.Json;
using Schulz.DoenerControl.Api.Endpoints.Orders;
using Schulz.DoenerControl.Api.Tests.Auth;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Orders;

public sealed class GetMyOrderTests : DoenerControlTestBase
{
    public GetMyOrderTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Return_Unauthorized_When_Not_Authenticated()
    {
        var auth = new AuthTestClient(App.CreateClient());

        var response = await auth.GetAsync($"/api/order-days/{Guid.NewGuid()}/orders/mine");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Should_Return_HasOrderFalse_When_Caller_Has_Not_Ordered()
    {
        // The chef opens the day; a colleague who never orders queries their own order. Tests in a
        // class share one DB + one open day, so a non-ordering user keeps this case clean.
        var chef = await OrderTestHelpers.LoginAsChefAsync(App);
        var dayId = await OrderTestHelpers.OpenTodayAsync(chef);
        var auth = await OrderTestHelpers.LoginAsColleagueAsync(App, "n.fischer", "kollegePw11");

        var response = await auth.GetAsync($"/api/order-days/{dayId}/orders/mine");
        var body = await response.Content.ReadFromJsonAsync<GetMyOrderResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.False(body!.HasOrder);
        Assert.Null(body.Order);
    }

    [Fact]
    public async Task Should_Return_Order_When_Caller_Has_Ordered()
    {
        var auth = await OrderTestHelpers.LoginAsChefAsync(App);
        var dayId = await OrderTestHelpers.OpenTodayAsync(auth);
        await auth.PutJsonAsync(
            $"/api/order-days/{dayId}/orders/mine",
            OrderTestHelpers.DoenerBody(productId: "duerum", meat: "Haehnchen", priceCents: 800)
        );

        var response = await auth.GetAsync($"/api/order-days/{dayId}/orders/mine");
        var body = await response.Content.ReadFromJsonAsync<GetMyOrderResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.True(body!.HasOrder);
        Assert.NotNull(body.Order);
        Assert.Equal(800, body.Order!.PriceCents);
        var line = Assert.Single(body.Order.Lines);
        Assert.Equal("Dürüm Hähnchen", line.ProductLabel);
        Assert.Equal("doener", line.Kind);
        Assert.Equal("Haehnchen", line.Meat);
        Assert.Contains("Knoblauch", line.Sauces);
        Assert.Equal(800, line.PriceCents);
    }
}
