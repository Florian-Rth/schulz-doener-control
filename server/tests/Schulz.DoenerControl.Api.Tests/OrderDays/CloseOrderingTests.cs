using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Schulz.DoenerControl.Api.Endpoints.OrderDays;
using Schulz.DoenerControl.Api.Tests.Auth;
using Schulz.DoenerControl.Api.Tests.Debts;
using Schulz.DoenerControl.Infrastructure.Persistence;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.OrderDays;

// FEATURE 4a: a manual "Bestellung schließen" step distinct from closing the whole day. Only the
// designated collector may lock ordering; once locked, no further orders are accepted, even before
// the time cutoff. The harness gives each test CLASS its own fresh SQLite DB and only one OrderDay
// per day fits (unique Date index), so each day-consuming scenario lives in its own class.
internal static class CloseOrderingScenario
{
    // Opens today's day, has the chef pick up and become the designated collector, then returns the
    // chef's client and the day id — the ready state from which ordering can be closed.
    public static async Task<(AuthTestClient Chef, Guid DayId)> WithChefCollectorAsync(
        DoenerControlApp app
    )
    {
        var chef = await DebtTestHelpers.LoginAsChefAsync(app);
        var dayId = await DebtTestHelpers.OpenTodayAsync(chef);
        await DebtTestHelpers.PlaceOrderAsync(chef, dayId, priceCents: 950, isPickup: true);
        var chefId = await DebtTestHelpers.UserIdAsync(app, "m.wagner");
        await DebtTestHelpers.SetCollectorAsync(chef, dayId, chefId);
        return (chef, dayId);
    }
}

public sealed class CloseOrderingSuccessTests : DoenerControlTestBase
{
    public CloseOrderingSuccessTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Close_Ordering_For_Designated_Collector()
    {
        var (chef, dayId) = await CloseOrderingScenario.WithChefCollectorAsync(App);

        var response = await chef.PostAsync($"/api/order-days/{dayId}/close-ordering");
        var body = await response.Content.ReadFromJsonAsync<CloseOrderingResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.True(body!.Day.IsOrderingClosed);
        Assert.False(body.Day.ICanStillOrder);
        // CutoffLabel is now the bare "HH:mm" wall-clock moment ordering was closed (no " Uhr").
        Assert.Equal(ExpectedCloseLabel(), body.Day.CutoffLabel);
        // Locking ordering does NOT close the day.
        Assert.Equal("Open", body.Day.Status);

        using var scope = App.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var day = await database.OrderDays.SingleAsync(
            d => d.Id == dayId,
            TestContext.Current.CancellationToken
        );
        Assert.NotNull(day.OrderingClosedAt);
    }

    // OrderingClosedAt is stamped from the fixed clock; render the same bare "HH:mm" label the
    // projection produces (business timezone, no " Uhr").
    private static string ExpectedCloseLabel()
    {
        var berlin = TimeZoneInfo.FindSystemTimeZoneById("Europe/Berlin");
        return $"{TimeZoneInfo.ConvertTime(FixedTimeProvider.Instant, berlin):HH\\:mm}";
    }
}

public sealed class CloseOrderingNonCollectorTests : DoenerControlTestBase
{
    public CloseOrderingNonCollectorTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Reject_Close_Ordering_For_Non_Collector_403()
    {
        var (_, dayId) = await CloseOrderingScenario.WithChefCollectorAsync(App);

        // A different colleague (not the designated collector) tries to close ordering.
        var lukas = await DebtTestHelpers.LoginAsColleagueAsync(App, "l.brandt", "kollegePw11");

        var response = await lukas.PostAsync($"/api/order-days/{dayId}/close-ordering");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }
}

public sealed class CloseOrderingNoCollectorTests : DoenerControlTestBase
{
    public CloseOrderingNoCollectorTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Reject_When_No_Collector_403()
    {
        var chef = await DebtTestHelpers.LoginAsChefAsync(App);
        var dayId = await DebtTestHelpers.OpenTodayAsync(chef);
        // Order as a NON-pickup so auto-designate never fires → the day genuinely has no collector.
        await DebtTestHelpers.PlaceOrderAsync(chef, dayId, priceCents: 950, isPickup: false);

        // No collector designated → close-ordering is forbidden for everyone, even the opener.
        var response = await chef.PostAsync($"/api/order-days/{dayId}/close-ordering");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }
}

public sealed class CloseOrderingBlocksNewOrdersTests : DoenerControlTestBase
{
    public CloseOrderingBlocksNewOrdersTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Block_New_Orders_After_Ordering_Closed()
    {
        var (chef, dayId) = await CloseOrderingScenario.WithChefCollectorAsync(App);

        var close = await chef.PostAsync($"/api/order-days/{dayId}/close-ordering");
        Assert.Equal(HttpStatusCode.OK, close.StatusCode);

        // Ordering is locked before the cutoff: a fresh PUT /orders/mine is rejected with 409.
        var lukas = await DebtTestHelpers.LoginAsColleagueAsync(App, "l.brandt", "kollegePw11");
        var put = await lukas.PutJsonAsync(
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
                },
                IsPickup = false,
            }
        );

        Assert.Equal(HttpStatusCode.Conflict, put.StatusCode);
    }
}

public sealed class CloseOrderingNoTimeCutoffTests : DoenerControlTestBase
{
    public CloseOrderingNoTimeCutoffTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Still_Allow_Ordering_When_Past_Old_Time_Cutoff_Until_Collector_Closes()
    {
        var (chef, dayId) = await CloseOrderingScenario.WithChefCollectorAsync(App);

        // Advance the day's stored cutoff well past the fixed wall clock — the old 11:30 gate would
        // have blocked ordering here. With the time gate gone, ordering must remain open.
        using (var scope = App.Services.CreateScope())
        {
            var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var day = await database.OrderDays.SingleAsync(
                d => d.Id == dayId,
                TestContext.Current.CancellationToken
            );
            day.OrderCutoffAt = FixedTimeProvider.Instant.AddHours(-2);
            await database.SaveChangesAsync(TestContext.Current.CancellationToken);
        }

        var before = await chef.GetAsync($"/api/order-days/{dayId}");
        var beforeBody = await before.Content.ReadFromJsonAsync<GetOrderDayByIdResponse>(
            TestContext.Current.CancellationToken
        );
        Assert.Equal(HttpStatusCode.OK, before.StatusCode);
        Assert.NotNull(beforeBody);
        // Past the old cutoff, but the collector has not closed ordering → still orderable.
        Assert.True(beforeBody!.Day.ICanStillOrder);
        Assert.False(beforeBody.Day.IsOrderingClosed);
        Assert.Null(beforeBody.Day.CutoffLabel);

        // Only the collector closing ordering blocks it.
        var close = await chef.PostAsync($"/api/order-days/{dayId}/close-ordering");
        var closeBody = await close.Content.ReadFromJsonAsync<CloseOrderingResponse>(
            TestContext.Current.CancellationToken
        );
        Assert.Equal(HttpStatusCode.OK, close.StatusCode);
        Assert.NotNull(closeBody);
        Assert.False(closeBody!.Day.ICanStillOrder);
        Assert.True(closeBody.Day.IsOrderingClosed);
    }
}

public sealed class CloseOrderingAlreadyClosedTests : DoenerControlTestBase
{
    public CloseOrderingAlreadyClosedTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_409_When_Already_OrderingClosed()
    {
        var (chef, dayId) = await CloseOrderingScenario.WithChefCollectorAsync(App);

        var first = await chef.PostAsync($"/api/order-days/{dayId}/close-ordering");
        Assert.Equal(HttpStatusCode.OK, first.StatusCode);

        var second = await chef.PostAsync($"/api/order-days/{dayId}/close-ordering");

        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
    }
}

public sealed class CloseOrderingDayAlreadyClosedTests : DoenerControlTestBase
{
    public CloseOrderingDayAlreadyClosedTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_409_When_Day_Already_Closed()
    {
        var (chef, dayId) = await CloseOrderingScenario.WithChefCollectorAsync(App);

        var closeDay = await chef.PostAsync($"/api/order-days/{dayId}/close");
        Assert.Equal(HttpStatusCode.OK, closeDay.StatusCode);

        // The day is fully closed → close-ordering conflicts (not idempotently re-lockable).
        var response = await chef.PostAsync($"/api/order-days/{dayId}/close-ordering");

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }
}
