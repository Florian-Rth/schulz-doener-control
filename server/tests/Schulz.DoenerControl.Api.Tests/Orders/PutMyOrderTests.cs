using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Schulz.DoenerControl.Api.Endpoints.OrderDays;
using Schulz.DoenerControl.Api.Endpoints.Orders;
using Schulz.DoenerControl.Api.Tests.Auth;
using Schulz.DoenerControl.Api.Tests.OrderDays;
using Schulz.DoenerControl.Infrastructure.Persistence;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Orders;

// The F9 first-failing test, now multi-line: upsert is idempotent per (day,user) and only allowed
// while ordering is open. PUT while open creates (200); a second PUT replaces the order's whole line
// set on the same row (the composite unique index holds — no duplicate); PUT after the collector
// closes ordering is rejected (409). Then GET /orders/{id}/result returns the success-screen summary.
public sealed class PutMyOrderTests : DoenerControlTestBase
{
    private const string LoginUrl = "/api/auth/login";
    private const string OpenUrl = "/api/order-days/open";

    public PutMyOrderTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Return_Unauthorized_When_Not_Authenticated()
    {
        var auth = new AuthTestClient(App.CreateClient());

        var response = await auth.PutJsonAsync(
            $"/api/order-days/{Guid.NewGuid()}/orders/mine",
            SampleDoenerBody()
        );

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Should_Upsert_Edit_And_Reject_After_Ordering_Closed_And_Expose_Result()
    {
        var auth = await OrderDayTestHelpers.LoginAsChefAsync(App, LoginUrl);
        var dayId = await OpenTodayAsync(auth);

        // PUT before cutoff → 200 Created order with a single line.
        var create = await auth.PutJsonAsync(
            $"/api/order-days/{dayId}/orders/mine",
            SampleDoenerBody()
        );
        Assert.Equal(HttpStatusCode.OK, create.StatusCode);
        var created = await ReadOrder(create);
        Assert.NotNull(created);
        var createdLine = Assert.Single(created!.Lines);
        Assert.Equal("Döner Kalb", createdLine.ProductLabel);
        Assert.Equal(750, createdLine.PriceCents);
        Assert.Equal(1, createdLine.Quantity);
        Assert.Equal(750, created.PriceCents);
        Assert.False(created.IsPickup);
        var orderId = created.Id;

        // Second PUT REPLACES the order with TWO lines — same row, the unique (day,user) index holds.
        var edit = await auth.PutJsonAsync(
            $"/api/order-days/{dayId}/orders/mine",
            new
            {
                Lines = new[]
                {
                    new
                    {
                        ProductId = "duerum",
                        Meat = (string?)"Haehnchen",
                        PizzaVariant = (string?)null,
                        Sauces = new[] { "Knoblauch", "Scharf" },
                        PriceCents = 800,
                        Extra = (string?)"ohne Zwiebeln",
                        Quantity = 1,
                    },
                    new
                    {
                        ProductId = "pizza",
                        Meat = (string?)null,
                        PizzaVariant = (string?)Admin.AdminPizzaVariantTestHelpers.SalamiId,
                        Sauces = Array.Empty<string>(),
                        PriceCents = 900,
                        Extra = (string?)null,
                        Quantity = 1,
                    },
                },
                IsPickup = true,
            }
        );
        Assert.Equal(HttpStatusCode.OK, edit.StatusCode);
        var edited = await ReadOrder(edit);
        Assert.NotNull(edited);
        Assert.Equal(orderId, edited!.Id);
        Assert.Equal(2, edited.Lines.Count);
        Assert.Equal("Dürüm Hähnchen", edited.Lines[0].ProductLabel);
        Assert.Equal("Pizza Salami", edited.Lines[1].ProductLabel);
        Assert.Equal(1700, edited.PriceCents);
        Assert.True(edited.IsPickup);

        using (var scope = App.Services.CreateScope())
        {
            var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var count = await database.Orders.CountAsync(
                order => order.OrderDayId == dayId,
                TestContext.Current.CancellationToken
            );
            Assert.Equal(1, count);
            var lineCount = await database.OrderLines.CountAsync(
                line => line.Order!.OrderDayId == dayId,
                TestContext.Current.CancellationToken
            );
            Assert.Equal(2, lineCount);
        }

        // GET /orders/{id}/result returns the success-screen summary (caller is the pickup person,
        // so they collect from others — here the only order is their own → collects nothing yet).
        var resultResponse = await auth.GetAsync($"/api/orders/{orderId}/result");
        Assert.Equal(HttpStatusCode.OK, resultResponse.StatusCode);
        var summary = await resultResponse.Content.ReadFromJsonAsync<GetOrderResultResponse>(
            TestContext.Current.CancellationToken
        );
        Assert.NotNull(summary);
        Assert.Equal(2, summary!.Lines.Count);
        Assert.Equal("Dürüm Hähnchen", summary.Lines[0].ProductLabel);
        Assert.Equal(1700, summary.PriceCents);
        Assert.True(summary.IsPickup);

        // The collector locks ordering, then a further PUT is rejected with 409.
        await CloseOrderingAsync(dayId);

        var afterClose = await auth.PutJsonAsync(
            $"/api/order-days/{dayId}/orders/mine",
            SampleDoenerBody()
        );
        Assert.Equal(HttpStatusCode.Conflict, afterClose.StatusCode);
    }

    private static object SampleDoenerBody() => OrderTestHelpers.DoenerBody();

    private async Task<OrderDetailsDto?> ReadOrder(HttpResponseMessage response) =>
        await response.Content.ReadFromJsonAsync<OrderDetailsDto>(
            TestContext.Current.CancellationToken
        );

    private async Task<Guid> OpenTodayAsync(AuthTestClient auth)
    {
        var open = await auth.PostAsync(OpenUrl);
        var body = await open.Content.ReadFromJsonAsync<OpenDayResponse>(
            TestContext.Current.CancellationToken
        );
        return body!.Day.Id;
    }

    private async Task CloseOrderingAsync(Guid dayId)
    {
        using var scope = App.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var day = await database.OrderDays.SingleAsync(
            d => d.Id == dayId,
            TestContext.Current.CancellationToken
        );
        day.OrderingClosedAt = FixedTimeProvider.Instant;
        await database.SaveChangesAsync(TestContext.Current.CancellationToken);
    }
}
