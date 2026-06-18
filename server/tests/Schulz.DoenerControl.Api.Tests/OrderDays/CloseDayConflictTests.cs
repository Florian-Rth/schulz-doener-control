using System.Net;
using System.Net.Http.Json;
using Schulz.DoenerControl.Api.Endpoints.OrderDays;
using Schulz.DoenerControl.Api.Tests.Auth;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.OrderDays;

// Own fresh DB: opens today's day then closes it twice to assert the second close conflicts.
public sealed class CloseDayConflictTests : DoenerControlTestBase
{
    private const string LoginUrl = "/api/auth/login";
    private const string OpenUrl = "/api/order-days/open";

    public CloseDayConflictTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Return_Conflict_When_Already_Closed()
    {
        var auth = await OrderDayTestHelpers.LoginAsChefAsync(App, LoginUrl);

        var open = await auth.PostAsync(OpenUrl);
        var openBody = await open.Content.ReadFromJsonAsync<OpenDayResponse>(
            TestContext.Current.CancellationToken
        );
        var dayId = openBody!.Day.Id;

        var first = await auth.PostAsync($"/api/order-days/{dayId}/close");
        Assert.Equal(HttpStatusCode.OK, first.StatusCode);

        var second = await auth.PostAsync($"/api/order-days/{dayId}/close");

        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
    }
}
