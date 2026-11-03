using System.Net;
using System.Net.Http.Json;
using Schulz.DoenerControl.Api.Endpoints.Orders;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Orders;

public sealed class PutMyOrderValidationTests : DoenerControlTestBase
{
    public PutMyOrderValidationTests(DoenerControlApp app)
        : base(app) { }

    private static object MeatAnswers =>
        new Dictionary<string, object> { ["meat"] = new { options = new[] { "kalb" } } };

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
                    Answers = MeatAnswers,
                    PriceCents = 0,
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
                    Answers = MeatAnswers,
                    PriceCents = 750,
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
                    Answers = MeatAnswers,
                    PriceCents = 100001,
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

        // Pizza's category has no `meat` field, so a meat answer is an unknown-field rejection.
        var response = await auth.PutJsonAsync(
            $"/api/order-days/{dayId}/orders/mine",
            Body(
                new
                {
                    ProductId = "pizza",
                    Answers = new Dictionary<string, object>
                    {
                        ["variant"] = new { options = new[] { "salami" } },
                        ["meat"] = new { options = new[] { "kalb" } },
                    },
                    PriceCents = 900,
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
                Lines = new object[]
                {
                    new
                    {
                        ProductId = "doener",
                        Answers = MeatAnswers,
                        PriceCents = 750,
                        Quantity = 1,
                    },
                    // Second line is a pizza carrying a meat answer → invalid; the per-line answer
                    // check against the pizza category must reject the whole upsert.
                    new
                    {
                        ProductId = "pizza",
                        Answers = new Dictionary<string, object>
                        {
                            ["variant"] = new { options = new[] { "salami" } },
                            ["meat"] = new { options = new[] { "kalb" } },
                        },
                        PriceCents = 900,
                        Quantity = 1,
                    },
                },
                IsPickup = false,
            }
        );

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Should_Accept_Pizza_With_Variant()
    {
        var auth = await OrderTestHelpers.LoginAsChefAsync(App);
        var dayId = await OrderTestHelpers.OpenTodayAsync(auth);

        var response = await auth.PutJsonAsync(
            $"/api/order-days/{dayId}/orders/mine",
            Body(
                new
                {
                    ProductId = "pizza",
                    Answers = new Dictionary<string, object>
                    {
                        ["variant"] = new { options = new[] { "salami" } },
                    },
                    PriceCents = 900,
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
        Assert.Equal("Pizza", line.ProductLabel);
        Assert.Equal(["salami"], line.Answers["variant"].Options);
        Assert.Contains("Salami", line.Detail);
    }

    private static object Body(object line) => new { Lines = new[] { line }, IsPickup = false };
}
