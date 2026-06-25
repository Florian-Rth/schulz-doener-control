using System.Net;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Schulz.DoenerControl.Api.Tests.Auth;
using Schulz.DoenerControl.Api.Tests.Debts;
using Schulz.DoenerControl.Core.Enums;
using Schulz.DoenerControl.Infrastructure.Persistence;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.OrderDays;

// Admin scrap-and-end: an admin may force-end a running Döner-Tag in any state — even one someone
// opened by accident or that already has orders. It discards every order and closes the day WITHOUT
// crystallizing debts (unlike the collector's normal close). Own DB: the unique Date index fits one
// OrderDay.
public sealed class ForceEndDayTests : DoenerControlTestBase
{
    public ForceEndDayTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Discard_Orders_And_Close_Day_Without_Debts_When_Admin_Force_Ends()
    {
        // Chef is the seeded admin and is NOT the collector here; a colleague has already ordered.
        var chef = await DebtTestHelpers.LoginAsChefAsync(App);
        var dayId = await DebtTestHelpers.OpenTodayAsync(chef);
        var lukas = await DebtTestHelpers.LoginAsColleagueAsync(App, "l.brandt", "kollegePw11");
        await DebtTestHelpers.PlaceOrderAsync(lukas, dayId, priceCents: 750, isPickup: false);

        var response = await chef.PostAsync($"/api/order-days/{dayId}/force-end");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        using var scope = App.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var day = await database.OrderDays.SingleAsync(
            d => d.Id == dayId,
            TestContext.Current.CancellationToken
        );
        Assert.Equal(OrderDayStatus.Closed, day.Status);
        Assert.NotNull(day.ClosedAt);
        Assert.Null(day.CollectorUserId);

        var remainingOrders = await database.Orders.CountAsync(
            o => o.OrderDayId == dayId,
            TestContext.Current.CancellationToken
        );
        Assert.Equal(0, remainingOrders);

        var debts = await database.Debts.CountAsync(
            d => d.OrderDayId == dayId,
            TestContext.Current.CancellationToken
        );
        Assert.Equal(0, debts);
    }

    [Fact]
    public async Task Should_Return_Unauthorized_When_Not_Authenticated()
    {
        var auth = new AuthTestClient(App.CreateClient());

        var response = await auth.PostAsync($"/api/order-days/{Guid.NewGuid()}/force-end");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}

// Force-end is admin-only (Roles("Admin")): a regular colleague is rejected with 403.
public sealed class ForceEndDayNonAdminTests : DoenerControlTestBase
{
    public ForceEndDayNonAdminTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Return_Forbidden_When_Caller_Is_Not_Admin()
    {
        var chef = await DebtTestHelpers.LoginAsChefAsync(App);
        var dayId = await DebtTestHelpers.OpenTodayAsync(chef);
        var lukas = await DebtTestHelpers.LoginAsColleagueAsync(App, "l.brandt", "kollegePw11");

        var response = await lukas.PostAsync($"/api/order-days/{dayId}/force-end");

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }
}

// Force-ending an already-closed day is a conflict — there is nothing left to end.
public sealed class ForceEndDayAlreadyClosedTests : DoenerControlTestBase
{
    public ForceEndDayAlreadyClosedTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Return_Conflict_When_Day_Already_Closed()
    {
        var chef = await DebtTestHelpers.LoginAsChefAsync(App);
        var dayId = await DebtTestHelpers.OpenTodayAsync(chef);

        var first = await chef.PostAsync($"/api/order-days/{dayId}/force-end");
        Assert.Equal(HttpStatusCode.OK, first.StatusCode);

        var second = await chef.PostAsync($"/api/order-days/{dayId}/force-end");
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
    }
}
