using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Schulz.DoenerControl.Api.Endpoints.OrderDays;
using Schulz.DoenerControl.Api.Endpoints.Orders;
using Schulz.DoenerControl.Api.Tests.Auth;
using Schulz.DoenerControl.Infrastructure.Persistence;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Orders;

public sealed class ClaimCollectorTests : DoenerControlTestBase
{
    public ClaimCollectorTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Return_Unauthorized_When_Not_Authenticated()
    {
        var auth = new AuthTestClient(App.CreateClient());

        var response = await auth.PostAsync($"/api/order-days/{Guid.NewGuid()}/collector/claim");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Should_Make_Caller_Collector_When_No_Collector_Yet()
    {
        var auth = await OrderTestHelpers.LoginAsChefAsync(App);
        var dayId = await OrderTestHelpers.OpenTodayAsync(auth);
        await auth.PutJsonAsync(
            $"/api/order-days/{dayId}/orders/mine",
            OrderTestHelpers.DoenerBody()
        );

        var response = await auth.PostAsync($"/api/order-days/{dayId}/collector/claim");
        var body = await response.Content.ReadFromJsonAsync<ClaimCollectorResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.True(body!.Day.AmICollector);
        Assert.NotNull(body.Day.Abholer);
        Assert.Equal("Markus Wagner", body.Day.Abholer!.Name);
    }

    [Fact]
    public async Task Should_Reject_When_Caller_Has_No_Order()
    {
        // The chef opens the day; a colleague who never ordered tries to claim collector → 400.
        var chef = await OrderTestHelpers.LoginAsChefAsync(App);
        var dayId = await OrderTestHelpers.OpenTodayAsync(chef);
        var auth = await OrderTestHelpers.LoginAsColleagueAsync(App, "p.weber", "kollegePw22");

        var response = await auth.PostAsync($"/api/order-days/{dayId}/collector/claim");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Should_Take_Over_Collector_From_Another_User()
    {
        // User A (chef) orders and becomes collector. User B (a colleague) then orders and claims —
        // the take-over path: B becomes collector unconditionally, A is no longer.
        var chef = await OrderTestHelpers.LoginAsChefAsync(App);
        var dayId = await OrderTestHelpers.OpenTodayAsync(chef);
        await chef.PutJsonAsync(
            $"/api/order-days/{dayId}/orders/mine",
            OrderTestHelpers.DoenerBody(isPickup: true)
        );
        await chef.PostAsync($"/api/order-days/{dayId}/collector/claim");
        var chefId = await OrderTestHelpers.UserIdByUsernameAsync(App, "m.wagner");

        var colleague = await OrderTestHelpers.LoginAsColleagueAsync(
            App,
            "l.brandt",
            "kollegePw11"
        );
        await colleague.PutJsonAsync(
            $"/api/order-days/{dayId}/orders/mine",
            OrderTestHelpers.DoenerBody(isPickup: false)
        );
        var colleagueId = await OrderTestHelpers.UserIdByUsernameAsync(App, "l.brandt");

        var response = await colleague.PostAsync($"/api/order-days/{dayId}/collector/claim");
        var body = await response.Content.ReadFromJsonAsync<ClaimCollectorResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.True(body!.Day.AmICollector);
        // The displaced ex-collector must drop out of the open-day "Abholer heute:" list — only B.
        Assert.Equal(new[] { "Lukas Brandt" }, body.Day.PickupNames);

        using var scope = App.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var day = await database.OrderDays.SingleAsync(
            d => d.Id == dayId,
            TestContext.Current.CancellationToken
        );
        Assert.Equal(colleagueId, day.CollectorUserId);
        Assert.NotEqual(chefId, day.CollectorUserId);

        // A is no longer the collector (caller-relative flag read back as the chef), and crucially
        // their persisted order's pickup flag is cleared so they re-enter the close-day debtor set
        // instead of getting a free Döner.
        var chefView = await chef.GetAsync($"/api/order-days/{dayId}");
        var chefDay = await chefView.Content.ReadFromJsonAsync<GetOrderDayByIdResponse>(
            TestContext.Current.CancellationToken
        );
        Assert.False(chefDay!.Day.AmICollector);
        var chefOrder = await database.Orders.SingleAsync(
            order => order.OrderDayId == dayId && order.UserId == chefId,
            TestContext.Current.CancellationToken
        );
        Assert.False(chefOrder.IsPickup);
    }

    [Fact]
    public async Task Should_CreateDebtForDisplacedExCollector_When_TakeOverThenClose()
    {
        // The core financial-integrity regression. A (chef) orders and becomes collector; B and C
        // order as non-pickup. B takes over the collector role, then closes the day. Every non-pickup
        // payer — now including the displaced A — must owe B their own order amount; B owes nothing.
        var chef = await OrderTestHelpers.LoginAsChefAsync(App);
        var dayId = await OrderTestHelpers.OpenTodayAsync(chef);
        await chef.PutJsonAsync(
            $"/api/order-days/{dayId}/orders/mine",
            OrderTestHelpers.DoenerBody(priceCents: 950, isPickup: true)
        );
        await chef.PostAsync($"/api/order-days/{dayId}/collector/claim");
        var chefId = await OrderTestHelpers.UserIdByUsernameAsync(App, "m.wagner");

        var lukas = await OrderTestHelpers.LoginAsColleagueAsync(App, "l.brandt", "kollegePw11");
        await lukas.PutJsonAsync(
            $"/api/order-days/{dayId}/orders/mine",
            OrderTestHelpers.DoenerBody(priceCents: 750, isPickup: false)
        );
        var lukasId = await OrderTestHelpers.UserIdByUsernameAsync(App, "l.brandt");

        var sara = await OrderTestHelpers.LoginAsColleagueAsync(App, "s.yilmaz", "kollegePw22");
        await sara.PutJsonAsync(
            $"/api/order-days/{dayId}/orders/mine",
            OrderTestHelpers.DoenerBody(priceCents: 800, isPickup: false)
        );
        var saraId = await OrderTestHelpers.UserIdByUsernameAsync(App, "s.yilmaz");

        // Lukas (B) takes over the collector role, then closes the day as the authoritative Abholer.
        await lukas.PostAsync($"/api/order-days/{dayId}/collector/claim");
        var closeResponse = await lukas.PostAsync($"/api/order-days/{dayId}/close");

        Assert.Equal(HttpStatusCode.OK, closeResponse.StatusCode);

        using var scope = App.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var debts = await database
            .Debts.Where(debt => debt.OrderDayId == dayId)
            .ToListAsync(TestContext.Current.CancellationToken);

        // A (chef) and C (Sara) each owe B (Lukas) their own order amount; B owes nothing.
        Assert.Equal(2, debts.Count);
        Assert.All(debts, debt => Assert.Equal(lukasId, debt.CreditorUserId));
        Assert.DoesNotContain(debts, debt => debt.DebtorUserId == lukasId);

        var chefDebt = debts.Single(debt => debt.DebtorUserId == chefId);
        Assert.Equal(950, chefDebt.AmountCents);
        var saraDebt = debts.Single(debt => debt.DebtorUserId == saraId);
        Assert.Equal(800, saraDebt.AmountCents);
    }
}
