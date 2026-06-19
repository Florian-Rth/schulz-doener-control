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

// The F9 first-failing test: upsert is idempotent per (day,user) and only allowed before cutoff.
// PUT before cutoff creates (200); a second PUT edits the same row (the composite unique index
// holds — no duplicate); PUT after cutoff is rejected (409). Then GET /orders/{id}/result returns
// the server-driven success-screen summary.
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
    public async Task Should_Upsert_Edit_And_Reject_After_Cutoff_And_Expose_Result()
    {
        var auth = await OrderDayTestHelpers.LoginAsChefAsync(App, LoginUrl);
        var dayId = await OpenTodayAsync(auth);

        // PUT before cutoff → 200 Created order.
        var create = await auth.PutJsonAsync(
            $"/api/order-days/{dayId}/orders/mine",
            SampleDoenerBody()
        );
        Assert.Equal(HttpStatusCode.OK, create.StatusCode);
        var created = await ReadOrder(create);
        Assert.NotNull(created);
        Assert.Equal("Döner Kalb", created!.ProductLabel);
        Assert.Equal(750, created.PriceCents);
        Assert.False(created.IsPickup);
        var orderId = created.Id;

        // Second PUT edits the same order — the unique (day,user) index holds, no duplicate row.
        var edit = await auth.PutJsonAsync(
            $"/api/order-days/{dayId}/orders/mine",
            new
            {
                ProductId = "duerum",
                Meat = "Haehnchen",
                PizzaVariant = (string?)null,
                Sauces = new[] { "Knoblauch", "Scharf" },
                PriceCents = 800,
                Extra = "ohne Zwiebeln",
                IsPickup = true,
            }
        );
        Assert.Equal(HttpStatusCode.OK, edit.StatusCode);
        var edited = await ReadOrder(edit);
        Assert.NotNull(edited);
        Assert.Equal(orderId, edited!.Id);
        Assert.Equal("Dürüm Hähnchen", edited.ProductLabel);
        Assert.Equal(800, edited.PriceCents);
        Assert.True(edited.IsPickup);

        using (var scope = App.Services.CreateScope())
        {
            var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var count = await database.Orders.CountAsync(
                order => order.OrderDayId == dayId,
                TestContext.Current.CancellationToken
            );
            Assert.Equal(1, count);
        }

        // GET /orders/{id}/result returns the success-screen summary (caller is the pickup person,
        // so they collect from others — here the only order is their own → collects nothing yet).
        var resultResponse = await auth.GetAsync($"/api/orders/{orderId}/result");
        Assert.Equal(HttpStatusCode.OK, resultResponse.StatusCode);
        var summary = await resultResponse.Content.ReadFromJsonAsync<GetOrderResultResponse>(
            TestContext.Current.CancellationToken
        );
        Assert.NotNull(summary);
        Assert.Equal("Dürüm Hähnchen", summary!.ProductLabel);
        Assert.Equal(800, summary.PriceCents);
        Assert.True(summary.IsPickup);

        // Push the persisted cutoff into the past, then a further PUT is rejected with 409.
        await MoveCutoffToPastAsync(dayId);

        var afterCutoff = await auth.PutJsonAsync(
            $"/api/order-days/{dayId}/orders/mine",
            SampleDoenerBody()
        );
        Assert.Equal(HttpStatusCode.Conflict, afterCutoff.StatusCode);
    }

    private static object SampleDoenerBody() =>
        new
        {
            ProductId = "doener",
            Meat = "Kalb",
            PizzaVariant = (string?)null,
            Sauces = new[] { "Knoblauch" },
            PriceCents = 750,
            Extra = (string?)null,
            IsPickup = false,
        };

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

    private async Task MoveCutoffToPastAsync(Guid dayId)
    {
        using var scope = App.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var day = await database.OrderDays.SingleAsync(
            d => d.Id == dayId,
            TestContext.Current.CancellationToken
        );
        day.OrderCutoffAt = DateTimeOffset.UtcNow.AddHours(-1);
        await database.SaveChangesAsync(TestContext.Current.CancellationToken);
    }
}
