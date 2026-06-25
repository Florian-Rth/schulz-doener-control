using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Schulz.DoenerControl.Api.Endpoints.OrderDays;
using Schulz.DoenerControl.Api.Tests.Auth;
using Schulz.DoenerControl.Api.Tests.Debts;
using Schulz.DoenerControl.Core.Enums;
using Schulz.DoenerControl.Infrastructure.Persistence;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.OrderDays;

public sealed class CloseDayTests : DoenerControlTestBase
{
    private const string LoginUrl = "/api/auth/login";
    private const string OpenUrl = "/api/order-days/open";

    public CloseDayTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Return_Unauthorized_When_Not_Authenticated()
    {
        var auth = new AuthTestClient(App.CreateClient());

        var response = await auth.PostAsync($"/api/order-days/{Guid.NewGuid()}/close");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Should_Close_Day_Setting_Status_And_ClosedAt_When_Open()
    {
        var auth = await OrderDayTestHelpers.LoginAsChefAsync(App, LoginUrl);
        var dayId = await OpenTodayAsync(auth);
        var chefId = await DebtTestHelpers.UserIdAsync(App, "m.wagner");
        await DebtTestHelpers.SeedCollectorAsync(App, dayId, chefId);

        var response = await auth.PostAsync($"/api/order-days/{dayId}/close");
        var body = await response.Content.ReadFromJsonAsync<CloseDayResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.Equal("Closed", body!.Day.Status);

        // No debt-generation feature yet: closing crystallizes zero debts (clean extension point).
        Assert.Equal(0, body.DebtsCreated);

        using var scope = App.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var day = await database.OrderDays.SingleAsync(
            d => d.Id == dayId,
            TestContext.Current.CancellationToken
        );
        Assert.Equal(OrderDayStatus.Closed, day.Status);
        Assert.NotNull(day.ClosedAt);
    }

    [Fact]
    public async Task Should_Return_NotFound_When_Day_Does_Not_Exist()
    {
        var auth = await OrderDayTestHelpers.LoginAsChefAsync(App, LoginUrl);

        var response = await auth.PostAsync($"/api/order-days/{Guid.NewGuid()}/close");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private async Task<Guid> OpenTodayAsync(AuthTestClient auth)
    {
        var open = await auth.PostAsync(OpenUrl);
        var body = await open.Content.ReadFromJsonAsync<OpenDayResponse>(
            TestContext.Current.CancellationToken
        );
        return body!.Day.Id;
    }
}

// FEATURE 4b authorization: only the designated collector may close the day. Each day-consuming
// scenario gets its own class because the unique Date index fits one OrderDay per day per database.
public sealed class CloseDayNonCollectorTests : DoenerControlTestBase
{
    public CloseDayNonCollectorTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Reject_Close_Day_For_Non_Collector_403()
    {
        var chef = await DebtTestHelpers.LoginAsChefAsync(App);
        var dayId = await DebtTestHelpers.OpenTodayAsync(chef);
        var chefId = await DebtTestHelpers.UserIdAsync(App, "m.wagner");
        await DebtTestHelpers.SeedCollectorAsync(App, dayId, chefId);

        // A different colleague (not the designated collector) tries to close the day.
        var lukas = await DebtTestHelpers.LoginAsColleagueAsync(App, "l.brandt", "kollegePw11");

        var response = await lukas.PostAsync($"/api/order-days/{dayId}/close");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }
}

public sealed class CloseDayNoCollectorTests : DoenerControlTestBase
{
    public CloseDayNoCollectorTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Reject_Close_Day_When_No_Collector_403()
    {
        var chef = await DebtTestHelpers.LoginAsChefAsync(App);
        var dayId = await DebtTestHelpers.OpenTodayAsync(chef);

        // No collector designated → closing the day is forbidden for everyone, even the opener. An
        // admin scrap-and-end is the separate ForceEnd action (see ForceEndDayTests).
        var response = await chef.PostAsync($"/api/order-days/{dayId}/close");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }
}
