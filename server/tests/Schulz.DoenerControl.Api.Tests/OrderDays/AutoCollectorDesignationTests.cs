using System.Net;
using System.Net.Http.Json;
using Schulz.DoenerControl.Api.Endpoints.OrderDays;
using Schulz.DoenerControl.Api.Tests.Auth;
using Schulz.DoenerControl.Api.Tests.Debts;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.OrderDays;

// Auto-designate: the order-form pickup toggle (PutMyOrder → IsPickup) makes the pickup person the
// day's collector when none is set yet, and clears it when the collector releases pickup. This is the
// missing wiring that previously left CollectorUserId null forever (only SetCollector touched it), so
// the close buttons and the Abholer PayPal block never appeared. Each scenario consumes one OrderDay
// (unique Date index), so each lives in its own fresh-DB test class.

public sealed class AutoCollectorDesignationOnOrderTests : DoenerControlTestBase
{
    private const string TodayUrl = "/api/order-days/today";

    public AutoCollectorDesignationOnOrderTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Make_Pickup_Orderer_The_Collector_When_No_Collector_Yet()
    {
        // The exact scenario the user hit: admin + a second user order, admin picks up via the order
        // form — no explicit SetCollector call ever happens.
        var chef = await DebtTestHelpers.LoginAsChefAsync(App);
        var dayId = await DebtTestHelpers.OpenTodayAsync(chef);
        await DebtTestHelpers.PlaceOrderAsync(chef, dayId, priceCents: 950, isPickup: true);

        var lukas = await DebtTestHelpers.LoginAsColleagueAsync(App, "l.brandt", "kollegePw11");
        await DebtTestHelpers.PlaceOrderAsync(lukas, dayId, priceCents: 760, isPickup: false);

        // The chef (the pickup) sees the collector controls and is the Abholer.
        var chefToday = await chef.GetAsync(TodayUrl);
        var chefBody = await chefToday.Content.ReadFromJsonAsync<GetTodayOrderDayResponse>(
            TestContext.Current.CancellationToken
        );
        Assert.Equal(HttpStatusCode.OK, chefToday.StatusCode);
        Assert.True(chefBody!.Day!.AmICollector);
        Assert.NotNull(chefBody.Day.Abholer);
        Assert.Equal(TestSeeding.ChefDisplayName, chefBody.Day.Abholer!.Name);

        // The non-pickup colleague sees the Abholer + their own PayPal deep-link (7,60 €).
        var lukasToday = await lukas.GetAsync(TodayUrl);
        var lukasBody = await lukasToday.Content.ReadFromJsonAsync<GetTodayOrderDayResponse>(
            TestContext.Current.CancellationToken
        );
        Assert.Equal(HttpStatusCode.OK, lukasToday.StatusCode);
        Assert.False(lukasBody!.Day!.AmICollector);
        Assert.NotNull(lukasBody.Day.Abholer);
        Assert.Equal(
            $"https://paypal.me/{TestSeeding.ChefPayPalHandle}/7.60EUR",
            lukasBody.Day.Abholer!.PayPalUrl
        );
    }
}

public sealed class AutoCollectorReleaseOnOrderTests : DoenerControlTestBase
{
    private const string TodayUrl = "/api/order-days/today";

    public AutoCollectorReleaseOnOrderTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Clear_Collector_When_Collector_Drops_Pickup_Via_Order_Form()
    {
        var chef = await DebtTestHelpers.LoginAsChefAsync(App);
        var dayId = await DebtTestHelpers.OpenTodayAsync(chef);
        // First pickup → auto-designated collector.
        await DebtTestHelpers.PlaceOrderAsync(chef, dayId, priceCents: 950, isPickup: true);

        // Re-submitting the same order with the pickup toggle OFF vacates the designation.
        await DebtTestHelpers.PlaceOrderAsync(chef, dayId, priceCents: 950, isPickup: false);

        var today = await chef.GetAsync(TodayUrl);
        var body = await today.Content.ReadFromJsonAsync<GetTodayOrderDayResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, today.StatusCode);
        Assert.False(body!.Day!.AmICollector);
        Assert.Null(body.Day.Abholer);
    }
}

public sealed class AutoCollectorKeepsExistingTests : DoenerControlTestBase
{
    private const string TodayUrl = "/api/order-days/today";

    public AutoCollectorKeepsExistingTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Not_Steal_Designation_From_An_Existing_Collector()
    {
        var chef = await DebtTestHelpers.LoginAsChefAsync(App);
        var dayId = await DebtTestHelpers.OpenTodayAsync(chef);
        // Chef picks up first → becomes the collector.
        await DebtTestHelpers.PlaceOrderAsync(chef, dayId, priceCents: 950, isPickup: true);

        // A second person also picks up — must NOT take over the existing designation.
        var lukas = await DebtTestHelpers.LoginAsColleagueAsync(App, "l.brandt", "kollegePw11");
        await DebtTestHelpers.PlaceOrderAsync(lukas, dayId, priceCents: 760, isPickup: true);

        var lukasToday = await lukas.GetAsync(TodayUrl);
        var lukasBody = await lukasToday.Content.ReadFromJsonAsync<GetTodayOrderDayResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, lukasToday.StatusCode);
        Assert.False(lukasBody!.Day!.AmICollector);
        Assert.NotNull(lukasBody.Day.Abholer);
        Assert.Equal(TestSeeding.ChefDisplayName, lukasBody.Day.Abholer!.Name);
    }
}
