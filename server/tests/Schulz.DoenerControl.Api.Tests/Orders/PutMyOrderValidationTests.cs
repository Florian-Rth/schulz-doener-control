using System.Net;
using System.Net.Http.Json;
using Schulz.DoenerControl.Api.Endpoints.Orders;
using Schulz.DoenerControl.Api.Tests.Auth;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Orders;

public sealed class PutMyOrderValidationTests : DoenerControlTestBase
{
    public PutMyOrderValidationTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Reject_When_No_Product_Or_Price()
    {
        var auth = await OrderTestHelpers.LoginAsChefAsync(App);
        var dayId = await OrderTestHelpers.OpenTodayAsync(auth);

        var response = await auth.PutJsonAsync(
            $"/api/order-days/{dayId}/orders/mine",
            new
            {
                ProductId = "",
                Meat = "Kalb",
                PizzaVariant = (string?)null,
                Sauces = Array.Empty<string>(),
                PriceCents = 0,
                Extra = (string?)null,
                IsPickup = false,
            }
        );

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Should_Reject_When_Pizza_Carries_Meat()
    {
        var auth = await OrderTestHelpers.LoginAsChefAsync(App);
        var dayId = await OrderTestHelpers.OpenTodayAsync(auth);

        var response = await auth.PutJsonAsync(
            $"/api/order-days/{dayId}/orders/mine",
            new
            {
                ProductId = "pizza",
                Meat = "Kalb",
                PizzaVariant = "Salami",
                Sauces = Array.Empty<string>(),
                PriceCents = 900,
                Extra = (string?)null,
                IsPickup = false,
            }
        );

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Should_Accept_Pizza_And_Freeze_Pizza_Kind()
    {
        var auth = await OrderTestHelpers.LoginAsChefAsync(App);
        var dayId = await OrderTestHelpers.OpenTodayAsync(auth);

        var response = await auth.PutJsonAsync(
            $"/api/order-days/{dayId}/orders/mine",
            new
            {
                ProductId = "pizza",
                Meat = (string?)null,
                PizzaVariant = "Salami",
                Sauces = Array.Empty<string>(),
                PriceCents = 900,
                Extra = (string?)null,
                IsPickup = false,
            }
        );
        var body = await response.Content.ReadFromJsonAsync<OrderDetailsDto>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.Equal("pizza", body!.Kind);
        Assert.Equal("Pizza Salami", body.ProductLabel);
        Assert.Null(body.Meat);
        Assert.Empty(body.Sauces);
    }
}
