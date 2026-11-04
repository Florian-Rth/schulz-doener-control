using System.Net.Http.Json;
using Schulz.DoenerControl.Api.Endpoints.Dashboard;
using Schulz.DoenerControl.Api.Tests.Debts;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.PickupWheel;

public sealed class SpinIfDueTests : DoenerControlTestBase
{
    public SpinIfDueTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_DesignateAParticipantAsCollector_When_DeadlinePassedWithoutAbholer()
    {
        var (dayId, chefId, lukasId) = await OpenDayWithTwoOrdersAsync();

        var spun = await PickupWheelTestHelpers.SpinIfDueAsync(
            App,
            PickupWheelTestHelpers.PassedDeadline
        );

        Assert.True(spun);
        var collectorId = await PickupWheelTestHelpers.CollectorIdAsync(App, dayId);
        Assert.Contains(collectorId!.Value, new[] { chefId, lukasId });
    }

    [Fact]
    public async Task Should_NotSpin_When_DeadlineNotReached()
    {
        var (dayId, _, _) = await OpenDayWithTwoOrdersAsync();

        var spun = await PickupWheelTestHelpers.SpinIfDueAsync(
            App,
            PickupWheelTestHelpers.UpcomingDeadline
        );

        Assert.False(spun);
        Assert.Null(await PickupWheelTestHelpers.CollectorIdAsync(App, dayId));
    }

    [Fact]
    public async Task Should_NotSpin_When_SomeoneVolunteered()
    {
        var chef = await DebtTestHelpers.LoginAsChefAsync(App);
        var dayId = await DebtTestHelpers.OpenTodayAsync(chef);
        await DebtTestHelpers.PlaceOrderAsync(chef, dayId, priceCents: 750, isPickup: true);

        var spun = await PickupWheelTestHelpers.SpinIfDueAsync(
            App,
            PickupWheelTestHelpers.PassedDeadline
        );

        Assert.False(spun);
        Assert.Equal(0, await PickupWheelTestHelpers.SpinCountAsync(App, dayId));
    }

    [Fact]
    public async Task Should_SpinOnlyOnce_When_CalledRepeatedly()
    {
        var (dayId, _, _) = await OpenDayWithTwoOrdersAsync();
        await PickupWheelTestHelpers.SpinIfDueAsync(App, PickupWheelTestHelpers.PassedDeadline);

        // The worker ticks every 30 s; once today's wheel has spun it must stay quiet.
        var spunAgain = await PickupWheelTestHelpers.SpinIfDueAsync(
            App,
            PickupWheelTestHelpers.PassedDeadline
        );

        Assert.False(spunAgain);
        Assert.Equal(1, await PickupWheelTestHelpers.SpinCountAsync(App, dayId));
    }

    [Fact]
    public async Task Should_NotSpin_When_NobodyOrdered()
    {
        var chef = await DebtTestHelpers.LoginAsChefAsync(App);
        await DebtTestHelpers.OpenTodayAsync(chef);

        var spun = await PickupWheelTestHelpers.SpinIfDueAsync(
            App,
            PickupWheelTestHelpers.PassedDeadline
        );

        Assert.False(spun);
    }

    [Fact]
    public async Task Should_ShowTheWheelOnTheDashboard_When_Spun()
    {
        var chef = await DebtTestHelpers.LoginAsChefAsync(App);
        var dayId = await DebtTestHelpers.OpenTodayAsync(chef);
        await DebtTestHelpers.PlaceOrderAsync(chef, dayId, priceCents: 750, isPickup: false);
        await PickupWheelTestHelpers.SpinIfDueAsync(App, PickupWheelTestHelpers.PassedDeadline);

        var response = await chef.GetAsync("/api/dashboard");
        var dashboard = await response.Content.ReadFromJsonAsync<GetDashboardResponse>(
            TestContext.Current.CancellationToken
        );

        var wheel = dashboard!.Day.Wheel;
        Assert.NotNull(wheel);
        Assert.Equal(1, wheel.Round);
        Assert.True(wheel.AmIChosen);
        var candidate = Assert.Single(wheel.Candidates);
        Assert.True(candidate.IsChosen);
        // Alone on the wheel: nobody left to re-spin to.
        Assert.False(wheel.CanExcuse);
    }

    private async Task<(Guid DayId, Guid ChefId, Guid LukasId)> OpenDayWithTwoOrdersAsync()
    {
        var chef = await DebtTestHelpers.LoginAsChefAsync(App);
        var dayId = await DebtTestHelpers.OpenTodayAsync(chef);
        await DebtTestHelpers.PlaceOrderAsync(chef, dayId, priceCents: 750, isPickup: false);
        var lukas = await DebtTestHelpers.LoginAsColleagueAsync(App, "l.brandt", "kollegePw11");
        await DebtTestHelpers.PlaceOrderAsync(lukas, dayId, priceCents: 800, isPickup: false);

        var chefId = await DebtTestHelpers.UserIdAsync(App, "m.wagner");
        var lukasId = await DebtTestHelpers.UserIdAsync(App, "l.brandt");
        return (dayId, chefId, lukasId);
    }
}
