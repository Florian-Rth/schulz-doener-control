using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Schulz.DoenerControl.Api.Endpoints.Dashboard;
using Schulz.DoenerControl.Api.Endpoints.OrderDays;
using Schulz.DoenerControl.Api.Tests.Debts;
using Schulz.DoenerControl.Core.Enums;
using Schulz.DoenerControl.Infrastructure.Persistence;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.OrderDays;

// After the collector closes a Döner-Tag, the ritual must be re-startable the same calendar day: the
// closed day no longer counts as "today's active day" (the partial unique index only forbids a second
// NON-closed day). Each scenario opens/closes a day, so — like the close-day tests — every scenario
// lives in its own class to get its own fresh DB (one active OrderDay per day per database).

public sealed class ClosedDayTodayResolvesToNoActiveDayTests : DoenerControlTestBase
{
    public ClosedDayTodayResolvesToNoActiveDayTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Report_Day_Not_Open_When_Closed_Today()
    {
        var chef = await DebtTestHelpers.LoginAsChefAsync(App);
        var dayId = await DebtTestHelpers.OpenTodayAsync(chef);
        var chefId = await DebtTestHelpers.UserIdAsync(App, "m.wagner");
        await DebtTestHelpers.SeedCollectorAsync(App, dayId, chefId);
        await chef.PostAsync($"/api/order-days/{dayId}/close");

        // Dashboard: a day closed earlier today resolves to "no active day" → IsOpen false, no flags.
        var dashboard = await chef.GetAsync("/api/dashboard");
        var dashboardBody = await dashboard.Content.ReadFromJsonAsync<GetDashboardResponse>(
            TestContext.Current.CancellationToken
        );
        Assert.NotNull(dashboardBody);
        Assert.False(dashboardBody!.Day.IsOpen);
        Assert.Null(dashboardBody.Day.Id);

        // GET /today: same resolution, the no-open-day shape.
        var today = await chef.GetAsync("/api/order-days/today");
        var todayBody = await today.Content.ReadFromJsonAsync<GetTodayOrderDayResponse>(
            TestContext.Current.CancellationToken
        );
        Assert.NotNull(todayBody);
        Assert.False(todayBody!.IsOpen);
        Assert.Null(todayBody.Day);
    }
}

public sealed class ReopenAfterCloseTests : DoenerControlTestBase
{
    private const string OpenUrl = "/api/order-days/open";

    public ReopenAfterCloseTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Open_New_Day_When_Reopened_After_Close_Same_Date()
    {
        var chef = await DebtTestHelpers.LoginAsChefAsync(App);
        var firstDayId = await DebtTestHelpers.OpenTodayAsync(chef);
        var chefId = await DebtTestHelpers.UserIdAsync(App, "m.wagner");
        await DebtTestHelpers.SeedCollectorAsync(App, firstDayId, chefId);
        await chef.PostAsync($"/api/order-days/{firstDayId}/close");

        var reopen = await chef.PostAsync(OpenUrl);
        var reopenBody = await reopen.Content.ReadFromJsonAsync<OpenDayResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, reopen.StatusCode);
        Assert.NotNull(reopenBody);

        // A brand-new active day is minted, not the closed one returned.
        Assert.NotEqual(firstDayId, reopenBody!.Day.Id);
        Assert.Equal("Open", reopenBody.Day.Status);

        // Both rows coexist on the same calendar date — the partial unique index let the second in.
        using var scope = App.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var closed = await database.OrderDays.SingleAsync(
            d => d.Id == firstDayId,
            TestContext.Current.CancellationToken
        );
        var reopened = await database.OrderDays.SingleAsync(
            d => d.Id == reopenBody.Day.Id,
            TestContext.Current.CancellationToken
        );
        Assert.Equal(OrderDayStatus.Closed, closed.Status);
        Assert.Equal(OrderDayStatus.Open, reopened.Status);
        Assert.Equal(closed.Date, reopened.Date);

        var dayCount = await database.OrderDays.CountAsync(TestContext.Current.CancellationToken);
        Assert.Equal(2, dayCount);

        // GetTodayAsync now resolves to the new active day, not the closed one.
        var today = await chef.GetAsync("/api/order-days/today");
        var todayBody = await today.Content.ReadFromJsonAsync<GetTodayOrderDayResponse>(
            TestContext.Current.CancellationToken
        );
        Assert.NotNull(todayBody);
        Assert.True(todayBody!.IsOpen);
        Assert.Equal(reopenBody.Day.Id, todayBody.Day!.Id);
    }
}
