using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Schulz.DoenerControl.Api.Endpoints.OrderDays;
using Schulz.DoenerControl.Api.Tests.Auth;
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
