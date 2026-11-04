using System.Net;
using System.Net.Http.Json;
using Schulz.DoenerControl.Api.Endpoints.PickupWheel;
using Schulz.DoenerControl.Api.Tests.Auth;
using Schulz.DoenerControl.Api.Tests.Debts;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.PickupWheel;

public sealed class ExcusePickupWheelTests : DoenerControlTestBase
{
    public ExcusePickupWheelTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_SpinToTheOtherParticipant_When_ChosenPersonExcuses()
    {
        var day = await OpenDayWithTwoOrdersAsync();
        await PickupWheelTestHelpers.SpinIfDueAsync(App, PickupWheelTestHelpers.PassedDeadline);
        var (chosen, other) = await ResolveChosenAsync(day);

        var response = await chosen.Client.PostAsync(ExcuseUrl(day.DayId));
        var body = await response.Content.ReadFromJsonAsync<ExcusePickupWheelResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(other.UserId, await PickupWheelTestHelpers.CollectorIdAsync(App, day.DayId));
        var wheel = body!.Day.Wheel!;
        Assert.Equal(2, wheel.Round);
        Assert.False(wheel.AmIChosen);
        // The excused person is off this round's wheel.
        Assert.Single(wheel.Candidates);
        Assert.Single(wheel.ExcusedNames);
    }

    [Fact]
    public async Task Should_Forbid_When_CallerWasNotChosen()
    {
        var day = await OpenDayWithTwoOrdersAsync();
        await PickupWheelTestHelpers.SpinIfDueAsync(App, PickupWheelTestHelpers.PassedDeadline);
        var (_, other) = await ResolveChosenAsync(day);

        var response = await other.Client.PostAsync(ExcuseUrl(day.DayId));

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Should_Conflict_When_NobodyIsLeftOnTheWheel()
    {
        var day = await OpenDayWithTwoOrdersAsync();
        await PickupWheelTestHelpers.SpinIfDueAsync(App, PickupWheelTestHelpers.PassedDeadline);
        var (chosen, other) = await ResolveChosenAsync(day);
        await chosen.Client.PostAsync(ExcuseUrl(day.DayId));

        // The second chosen one is the last person standing — no escape.
        var response = await other.Client.PostAsync(ExcuseUrl(day.DayId));

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
        Assert.Equal(other.UserId, await PickupWheelTestHelpers.CollectorIdAsync(App, day.DayId));
    }

    [Fact]
    public async Task Should_Conflict_When_TheWheelHasNotSpun()
    {
        var day = await OpenDayWithTwoOrdersAsync();

        var response = await day.Chef.Client.PostAsync(ExcuseUrl(day.DayId));

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    private static string ExcuseUrl(Guid dayId) => $"/api/order-days/{dayId}/pickup-wheel/excuse";

    private async Task<WheelDay> OpenDayWithTwoOrdersAsync()
    {
        var chef = await DebtTestHelpers.LoginAsChefAsync(App);
        var dayId = await DebtTestHelpers.OpenTodayAsync(chef);
        await DebtTestHelpers.PlaceOrderAsync(chef, dayId, priceCents: 750, isPickup: false);
        var lukas = await DebtTestHelpers.LoginAsColleagueAsync(App, "l.brandt", "kollegePw11");
        await DebtTestHelpers.PlaceOrderAsync(lukas, dayId, priceCents: 800, isPickup: false);

        return new WheelDay(
            dayId,
            new Participant(chef, await DebtTestHelpers.UserIdAsync(App, "m.wagner")),
            new Participant(lukas, await DebtTestHelpers.UserIdAsync(App, "l.brandt"))
        );
    }

    private async Task<(Participant Chosen, Participant Other)> ResolveChosenAsync(WheelDay day)
    {
        var collectorId = await PickupWheelTestHelpers.CollectorIdAsync(App, day.DayId);
        return collectorId == day.Chef.UserId ? (day.Chef, day.Lukas) : (day.Lukas, day.Chef);
    }

    private sealed record Participant(AuthTestClient Client, Guid UserId);

    private sealed record WheelDay(Guid DayId, Participant Chef, Participant Lukas);
}
