using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Schulz.DoenerControl.Api.Endpoints.OrderDays;
using Schulz.DoenerControl.Infrastructure.Persistence;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.OrderDays;

// Own fresh DB so opening "today" twice exercises the idempotent path against a clean unique-Date
// index (no other test in the class has already taken today's slot).
public sealed class OpenDayIdempotencyTests : DoenerControlTestBase
{
    private const string LoginUrl = "/api/auth/login";
    private const string OpenUrl = "/api/order-days/open";

    public OpenDayIdempotencyTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Return_Existing_Day_And_Notify_Nobody_When_Opened_Twice()
    {
        var auth = await OrderDayTestHelpers.LoginAsChefAsync(App, LoginUrl);

        var first = await auth.PostAsync(OpenUrl);
        var firstBody = await first.Content.ReadFromJsonAsync<OpenDayResponse>(
            TestContext.Current.CancellationToken
        );

        var second = await auth.PostAsync(OpenUrl);
        var secondBody = await second.Content.ReadFromJsonAsync<OpenDayResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, second.StatusCode);
        Assert.NotNull(firstBody);
        Assert.NotNull(secondBody);

        // The same day comes back, never a new one.
        Assert.Equal(firstBody!.Day.Id, secondBody!.Day.Id);
        Assert.Equal(firstBody.Day.Synonym, secondBody.Day.Synonym);

        // Re-opening notifies nobody again, and no second day row is created.
        Assert.Equal(0, secondBody.NotifiedColleagueCount);

        using var scope = App.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var dayCount = await database.OrderDays.CountAsync(TestContext.Current.CancellationToken);
        Assert.Equal(1, dayCount);
    }
}
