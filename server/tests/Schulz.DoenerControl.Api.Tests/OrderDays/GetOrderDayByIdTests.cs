using System.Net;
using System.Net.Http.Json;
using Schulz.DoenerControl.Api.Endpoints.OrderDays;
using Schulz.DoenerControl.Api.Tests.Auth;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.OrderDays;

public sealed class GetOrderDayByIdTests : DoenerControlTestBase
{
    private const string LoginUrl = "/api/auth/login";
    private const string OpenUrl = "/api/order-days/open";

    public GetOrderDayByIdTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Return_Unauthorized_When_Not_Authenticated()
    {
        var auth = new AuthTestClient(App.CreateClient());

        var response = await auth.GetAsync($"/api/order-days/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Should_Return_Day_When_It_Exists()
    {
        var auth = await OrderDayTestHelpers.LoginAsChefAsync(App, LoginUrl);
        var open = await auth.PostAsync(OpenUrl);
        var openBody = await open.Content.ReadFromJsonAsync<OpenDayResponse>(
            TestContext.Current.CancellationToken
        );

        var response = await auth.GetAsync($"/api/order-days/{openBody!.Day.Id}");
        var body = await response.Content.ReadFromJsonAsync<GetOrderDayByIdResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.Equal(openBody.Day.Id, body!.Day.Id);
        Assert.Equal(openBody.Day.Synonym, body.Day.Synonym);
        Assert.Equal("Open", body.Day.Status);
    }

    [Fact]
    public async Task Should_Return_NotFound_When_Day_Does_Not_Exist()
    {
        var auth = await OrderDayTestHelpers.LoginAsChefAsync(App, LoginUrl);

        var response = await auth.GetAsync($"/api/order-days/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }
}
