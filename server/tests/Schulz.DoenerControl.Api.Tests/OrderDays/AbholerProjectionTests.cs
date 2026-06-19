using System.Net;
using System.Net.Http.Json;
using Schulz.DoenerControl.Api.Endpoints.OrderDays;
using Schulz.DoenerControl.Api.Tests.Auth;
using Schulz.DoenerControl.Api.Tests.Debts;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.OrderDays;

// FEATURE 3 / B11: the day projection now carries the designated Abholer (collector) and a
// per-caller PayPal deep link, plus amICollector for close-button gating. Each scenario consumes one
// OrderDay (unique Date index), so each lives in its own fresh-DB test class.

public sealed class AbholerProjectionForNonPickupPayerTests : DoenerControlTestBase
{
    private const string TodayUrl = "/api/order-days/today";

    public AbholerProjectionForNonPickupPayerTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Expose_Abholer_With_PayPalUrl_For_Non_Pickup_Caller_Who_Ordered()
    {
        var chef = await DebtTestHelpers.LoginAsChefAsync(App);
        var dayId = await DebtTestHelpers.OpenTodayAsync(chef);
        await DebtTestHelpers.PlaceOrderAsync(chef, dayId, priceCents: 950, isPickup: true);

        var lukas = await DebtTestHelpers.LoginAsColleagueAsync(App, "l.brandt", "kollegePw11");
        await DebtTestHelpers.PlaceOrderAsync(lukas, dayId, priceCents: 760, isPickup: false);

        var chefId = await DebtTestHelpers.UserIdAsync(App, "m.wagner");
        await DebtTestHelpers.SetCollectorAsync(chef, dayId, chefId);

        var today = await lukas.GetAsync(TodayUrl);
        var body = await today.Content.ReadFromJsonAsync<GetTodayOrderDayResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, today.StatusCode);
        Assert.NotNull(body!.Day);
        Assert.False(body.Day!.AmICollector);
        Assert.NotNull(body.Day.Abholer);
        Assert.Equal(TestSeeding.ChefDisplayName, body.Day.Abholer!.Name);
        Assert.Equal("MW", body.Day.Abholer.Initials);
        // The link embeds the CALLER's own order total (7,60 €), not the collector's.
        Assert.Equal(
            $"https://paypal.me/{TestSeeding.ChefPayPalHandle}/7.60EUR",
            body.Day.Abholer.PayPalUrl
        );
    }
}

public sealed class AbholerProjectionNoCollectorTests : DoenerControlTestBase
{
    private const string TodayUrl = "/api/order-days/today";

    public AbholerProjectionNoCollectorTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Have_Null_Abholer_When_No_Collector_Designated()
    {
        var chef = await DebtTestHelpers.LoginAsChefAsync(App);
        var dayId = await DebtTestHelpers.OpenTodayAsync(chef);
        await DebtTestHelpers.PlaceOrderAsync(chef, dayId, priceCents: 950, isPickup: true);

        var today = await chef.GetAsync(TodayUrl);
        var body = await today.Content.ReadFromJsonAsync<GetTodayOrderDayResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, today.StatusCode);
        Assert.NotNull(body!.Day);
        // Strict CollectorUserId: no opener/first-pickup heuristic, so no collector means no Abholer.
        Assert.Null(body.Day!.Abholer);
        Assert.False(body.Day.AmICollector);
    }
}

public sealed class AbholerProjectionCollectorWithoutHandleTests : DoenerControlTestBase
{
    private const string TodayUrl = "/api/order-days/today";

    public AbholerProjectionCollectorWithoutHandleTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Have_Null_PayPalUrl_When_Collector_Has_No_Handle()
    {
        var chef = await DebtTestHelpers.LoginAsChefAsync(App);
        var dayId = await DebtTestHelpers.OpenTodayAsync(chef);
        await DebtTestHelpers.PlaceOrderAsync(chef, dayId, priceCents: 950, isPickup: false);

        // Tobias has no PayPal handle (StandardColleagues). Seed him as collector directly so the
        // pickup precondition of SetCollector does not get in the way of the no-handle assertion.
        var tobias = await DebtTestHelpers.LoginAsColleagueAsync(App, "t.klein", "kollegePw33");
        await DebtTestHelpers.PlaceOrderAsync(tobias, dayId, priceCents: 700, isPickup: true);
        var tobiasId = await DebtTestHelpers.UserIdAsync(App, "t.klein");
        await DebtTestHelpers.SeedCollectorAsync(App, dayId, tobiasId);

        var today = await chef.GetAsync(TodayUrl);
        var body = await today.Content.ReadFromJsonAsync<GetTodayOrderDayResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, today.StatusCode);
        Assert.NotNull(body!.Day!.Abholer);
        Assert.Equal("Tobias Klein", body.Day.Abholer!.Name);
        // Caller (chef) ordered, is not the collector, but the collector has no handle → no link.
        Assert.Null(body.Day.Abholer.PayPalUrl);
    }
}

public sealed class AbholerProjectionCallerWithoutOrderTests : DoenerControlTestBase
{
    private const string TodayUrl = "/api/order-days/today";

    public AbholerProjectionCallerWithoutOrderTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Have_Null_PayPalUrl_When_Caller_Has_No_Order()
    {
        var chef = await DebtTestHelpers.LoginAsChefAsync(App);
        var dayId = await DebtTestHelpers.OpenTodayAsync(chef);
        await DebtTestHelpers.PlaceOrderAsync(chef, dayId, priceCents: 950, isPickup: true);

        var chefId = await DebtTestHelpers.UserIdAsync(App, "m.wagner");
        await DebtTestHelpers.SetCollectorAsync(chef, dayId, chefId);

        // Lukas has not ordered → no total to embed, so no link even though the collector has a handle.
        var lukas = await DebtTestHelpers.LoginAsColleagueAsync(App, "l.brandt", "kollegePw11");
        var today = await lukas.GetAsync(TodayUrl);
        var body = await today.Content.ReadFromJsonAsync<GetTodayOrderDayResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, today.StatusCode);
        Assert.NotNull(body!.Day!.Abholer);
        Assert.Null(body.Day.Abholer!.PayPalUrl);
        Assert.False(body.Day.AmICollector);
    }
}

public sealed class AbholerProjectionAmICollectorTests : DoenerControlTestBase
{
    private const string TodayUrl = "/api/order-days/today";

    public AbholerProjectionAmICollectorTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Set_AmICollector_True_For_Collector_And_Null_PayPalUrl_For_Self()
    {
        var chef = await DebtTestHelpers.LoginAsChefAsync(App);
        var dayId = await DebtTestHelpers.OpenTodayAsync(chef);
        await DebtTestHelpers.PlaceOrderAsync(chef, dayId, priceCents: 950, isPickup: true);

        var chefId = await DebtTestHelpers.UserIdAsync(App, "m.wagner");
        await DebtTestHelpers.SetCollectorAsync(chef, dayId, chefId);

        var today = await chef.GetAsync(TodayUrl);
        var body = await today.Content.ReadFromJsonAsync<GetTodayOrderDayResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, today.StatusCode);
        Assert.True(body!.Day!.AmICollector);
        Assert.NotNull(body.Day.Abholer);
        // The collector never gets a link to pay themselves.
        Assert.Null(body.Day.Abholer!.PayPalUrl);
    }
}
