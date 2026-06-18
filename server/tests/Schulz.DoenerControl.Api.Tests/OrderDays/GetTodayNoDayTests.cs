using System.Net;
using System.Net.Http.Json;
using Schulz.DoenerControl.Api.Endpoints.OrderDays;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.OrderDays;

// Own fresh DB so "no day opened today" is genuine — no sibling test has opened today's day.
public sealed class GetTodayNoDayTests : DoenerControlTestBase
{
    private const string LoginUrl = "/api/auth/login";
    private const string TodayUrl = "/api/order-days/today";

    public GetTodayNoDayTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Report_Not_Open_When_No_Day_Opened()
    {
        var auth = await OrderDayTestHelpers.LoginAsChefAsync(App, LoginUrl);

        var today = await auth.GetAsync(TodayUrl);
        var todayBody = await today.Content.ReadFromJsonAsync<GetTodayOrderDayResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, today.StatusCode);
        Assert.NotNull(todayBody);
        Assert.False(todayBody!.IsOpen);
        Assert.Null(todayBody.Day);
    }
}
