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
            Body(
                new
                {
                    ProductId = "",
                    Meat = (string?)"Kalb",
                    PizzaVariant = (string?)null,
                    Sauces = Array.Empty<string>(),
                    PriceCents = 0,
                    Extra = (string?)null,
                    Quantity = 1,
                }
            )
        );

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Should_Reject_When_Lines_Empty()
    {
        var auth = await OrderTestHelpers.LoginAsChefAsync(App);
        var dayId = await OrderTestHelpers.OpenTodayAsync(auth);

        var response = await auth.PutJsonAsync(
            $"/api/order-days/{dayId}/orders/mine",
            new { Lines = Array.Empty<object>(), IsPickup = false }
        );

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Should_Reject_When_Quantity_Out_Of_Range()
    {
        var auth = await OrderTestHelpers.LoginAsChefAsync(App);
        var dayId = await OrderTestHelpers.OpenTodayAsync(auth);

        var response = await auth.PutJsonAsync(
            $"/api/order-days/{dayId}/orders/mine",
            Body(
                new
                {
                    ProductId = "doener",
                    Meat = (string?)"Kalb",
                    PizzaVariant = (string?)null,
                    Sauces = new[] { "Knoblauch" },
                    PriceCents = 750,
                    Extra = (string?)null,
                    Quantity = 21,
                }
            )
        );

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Should_Reject_When_Price_Out_Of_Range()
    {
        var auth = await OrderTestHelpers.LoginAsChefAsync(App);
        var dayId = await OrderTestHelpers.OpenTodayAsync(auth);

        var response = await auth.PutJsonAsync(
            $"/api/order-days/{dayId}/orders/mine",
            Body(
                new
                {
                    ProductId = "doener",
                    Meat = (string?)"Kalb",
                    PizzaVariant = (string?)null,
                    Sauces = new[] { "Knoblauch" },
                    PriceCents = 100001,
                    Extra = (string?)null,
                    Quantity = 1,
                }
            )
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
            Body(
                new
                {
                    ProductId = "pizza",
                    Meat = (string?)"Kalb",
                    PizzaVariant = (string?)Admin.AdminPizzaVariantTestHelpers.SalamiId,
                    Sauces = Array.Empty<string>(),
                    PriceCents = 900,
                    Extra = (string?)null,
                    Quantity = 1,
                }
            )
        );

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Should_Reject_When_A_Single_Line_In_A_Multi_Line_Order_Is_Invalid()
    {
        var auth = await OrderTestHelpers.LoginAsChefAsync(App);
        var dayId = await OrderTestHelpers.OpenTodayAsync(auth);

        var response = await auth.PutJsonAsync(
            $"/api/order-days/{dayId}/orders/mine",
            new
            {
                Lines = new[]
                {
                    new
                    {
                        ProductId = "doener",
                        Meat = (string?)"Kalb",
                        PizzaVariant = (string?)null,
                        Sauces = new[] { "Knoblauch" },
                        PriceCents = 750,
                        Extra = (string?)null,
                        Quantity = 1,
                    },
                    // Second line is a pizza with meat → invalid; the per-line check must reject it.
                    new
                    {
                        ProductId = "pizza",
                        Meat = (string?)"Kalb",
                        PizzaVariant = (string?)Admin.AdminPizzaVariantTestHelpers.SalamiId,
                        Sauces = Array.Empty<string>(),
                        PriceCents = 900,
                        Extra = (string?)null,
                        Quantity = 1,
                    },
                },
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
            Body(
                new
                {
                    ProductId = "pizza",
                    Meat = (string?)null,
                    PizzaVariant = (string?)Admin.AdminPizzaVariantTestHelpers.SalamiId,
                    Sauces = Array.Empty<string>(),
                    PriceCents = 900,
                    Extra = (string?)null,
                    Quantity = 1,
                }
            )
        );
        var body = await response.Content.ReadFromJsonAsync<OrderDetailsDto>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        var line = Assert.Single(body!.Lines);
        Assert.Equal("pizza", line.Kind);
        Assert.Equal("Pizza Salami", line.ProductLabel);
        Assert.Null(line.Meat);
        Assert.Empty(line.Sauces);
    }

    private static object Body(object line) => new { Lines = new[] { line }, IsPickup = false };
}
