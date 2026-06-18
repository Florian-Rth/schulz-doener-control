using System.Net;
using System.Net.Http.Json;
using Schulz.DoenerControl.Api.Endpoints.OrderDays;
using Schulz.DoenerControl.Api.Tests.Auth;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.OrderDays;

public sealed class GetTodayOrderDayTests : DoenerControlTestBase
{
    private const string LoginUrl = "/api/auth/login";
    private const string OpenUrl = "/api/order-days/open";
    private const string TodayUrl = "/api/order-days/today";

    public GetTodayOrderDayTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Return_Unauthorized_When_Not_Authenticated()
    {
        var auth = new AuthTestClient(App.CreateClient());

        var response = await auth.GetAsync(TodayUrl);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Should_Reflect_Open_Day_When_Opened()
    {
        var auth = await OrderDayTestHelpers.LoginAsChefAsync(App, LoginUrl);

        var open = await auth.PostAsync(OpenUrl);
        var openBody = await open.Content.ReadFromJsonAsync<OpenDayResponse>(
            TestContext.Current.CancellationToken
        );

        var today = await auth.GetAsync(TodayUrl);
        var todayBody = await today.Content.ReadFromJsonAsync<GetTodayOrderDayResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, today.StatusCode);
        Assert.NotNull(todayBody);
        Assert.True(todayBody!.IsOpen);
        Assert.NotNull(todayBody.Day);
        Assert.Equal(openBody!.Day.Id, todayBody.Day!.Id);
        Assert.Equal(openBody.Day.Synonym, todayBody.Day.Synonym);
        Assert.Equal("Open", todayBody.Day.Status);
    }
}
