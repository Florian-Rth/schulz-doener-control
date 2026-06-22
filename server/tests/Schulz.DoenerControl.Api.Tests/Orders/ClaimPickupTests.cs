using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Schulz.DoenerControl.Api.Endpoints.Orders;
using Schulz.DoenerControl.Api.Tests.Auth;
using Schulz.DoenerControl.Infrastructure.Persistence;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Orders;

public sealed class ClaimPickupTests : DoenerControlTestBase
{
    public ClaimPickupTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Return_Unauthorized_When_Not_Authenticated()
    {
        var auth = new AuthTestClient(App.CreateClient());

        var response = await auth.PostAsync($"/api/order-days/{Guid.NewGuid()}/pickup/claim");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Should_Reject_Claim_When_Caller_Has_No_Order()
    {
        // The chef opens the day; a colleague who never ordered tries to claim pickup → rejected.
        // (Tests in a class share one DB + one open day, so a non-ordering user keeps this clean.)
        var chef = await OrderTestHelpers.LoginAsChefAsync(App);
        var dayId = await OrderTestHelpers.OpenTodayAsync(chef);
        var auth = await OrderTestHelpers.LoginAsColleagueAsync(App, "p.weber", "kollegePw22");

        var response = await auth.PostAsync($"/api/order-days/{dayId}/pickup/claim");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Should_Set_Pickup_Flag_And_List_Pickup_Names_When_Claimed()
    {
        var auth = await OrderTestHelpers.LoginAsChefAsync(App);
        var dayId = await OrderTestHelpers.OpenTodayAsync(auth);
        await auth.PutJsonAsync(
            $"/api/order-days/{dayId}/orders/mine",
            OrderTestHelpers.DoenerBody()
        );

        var response = await auth.PostAsync($"/api/order-days/{dayId}/pickup/claim");
        var body = await response.Content.ReadFromJsonAsync<ClaimPickupResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.True(body!.Order.IsPickup);
        Assert.Contains("Markus Wagner", body.AllPickupNames);
    }

    [Fact]
    public async Task Should_Auto_Designate_Claimer_As_Collector_When_No_Collector_Yet()
    {
        // Claiming pickup via the endpoint with no collector designated makes the claimer the day's
        // collector (the auto-designate flow, consistent with the order-form pickup toggle).
        var auth = await OrderTestHelpers.LoginAsChefAsync(App);
        var dayId = await OrderTestHelpers.OpenTodayAsync(auth);
        await auth.PutJsonAsync(
            $"/api/order-days/{dayId}/orders/mine",
            OrderTestHelpers.DoenerBody()
        );

        var response = await auth.PostAsync($"/api/order-days/{dayId}/pickup/claim");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var chefId = await OrderTestHelpers.UserIdByUsernameAsync(App, "m.wagner");
        using var scope = App.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var day = await database.OrderDays.SingleAsync(
            d => d.Id == dayId,
            TestContext.Current.CancellationToken
        );
        Assert.Equal(chefId, day.CollectorUserId);
    }
}
