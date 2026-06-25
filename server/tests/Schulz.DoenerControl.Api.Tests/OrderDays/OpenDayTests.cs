using System.Net;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Schulz.DoenerControl.Api.Endpoints.OrderDays;
using Schulz.DoenerControl.Api.Tests.Auth;
using Schulz.DoenerControl.Infrastructure.Persistence;
using Schulz.DoenerControl.Infrastructure.Persistence.Seeding;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.OrderDays;

// Every test in this class opens "today" exactly once. Because all tests share one fixture DB and
// there is a unique index on OrderDay.Date, a single class can only meaningfully open the day once;
// the open-once assertions are therefore consolidated into one test, and the distinct behaviors
// (idempotency, GetToday reflection, no-day) live in their own classes with their own fresh DBs.
public sealed class OpenDayTests : DoenerControlTestBase
{
    private const string LoginUrl = "/api/auth/login";
    private const string OpenUrl = "/api/order-days/open";

    public OpenDayTests(DoenerControlApp app)
        : base(app) { }

    [Fact]
    public async Task Should_Return_Unauthorized_When_Not_Authenticated()
    {
        var auth = new AuthTestClient(App.CreateClient());

        var response = await auth.PostAsync(OpenUrl);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Should_Open_Day_With_Synonym_Cutoff_And_Notify_Other_Active_Users()
    {
        var auth = await OrderDayTestHelpers.LoginAsChefAsync(App, LoginUrl);

        var response = await auth.PostAsync(OpenUrl);
        var body = await response.Content.ReadFromJsonAsync<OpenDayResponse>(
            TestContext.Current.CancellationToken
        );

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);

        // Day shape: open, with a stored synonym, no cutoff label yet (ordering still open), and
        // orderable now. The cutoff label only appears once the collector closes ordering.
        Assert.Equal("Open", body!.Day.Status);
        // The day's synonym is one of the seeded notification templates the open flow picks from.
        Assert.Contains(
            body.Day.Synonym,
            NotificationTemplateSeeder.CanonicalTemplates.Select(template => template.Synonym)
        );
        Assert.Null(body.Day.CutoffLabel);
        Assert.True(body.Day.ICanStillOrder);
        Assert.Equal(0, body.Day.ParticipantCount);
        Assert.Empty(body.Day.PickupNames);
        Assert.Empty(body.Day.Orders);
        Assert.NotEqual(Guid.Empty, body.Day.Id);

        using var scope = App.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var chef = await database.Users.SingleAsync(
            user => user.NormalizedUserName == "m.wagner",
            TestContext.Current.CancellationToken
        );
        var activeCount = await database.Users.CountAsync(
            user => user.IsActive,
            TestContext.Current.CancellationToken
        );
        var expected = activeCount - 1;

        var notifications = await database
            .Notifications.Where(n => n.OrderDayId == body.Day.Id)
            .ToListAsync(TestContext.Current.CancellationToken);

        // One notification per OTHER active user; the opener is never notified.
        Assert.Equal(expected, body.NotifiedColleagueCount);
        Assert.Equal(expected, notifications.Count);
        Assert.DoesNotContain(notifications, n => n.RecipientUserId == chef.Id);

        // The persisted body is the day's notification text (one of the editable templates, or the
        // built-in fallback) — non-empty and unread on creation. The body is free admin-editable
        // text, so it need not contain the synonym verbatim.
        Assert.All(notifications, n => Assert.False(string.IsNullOrWhiteSpace(n.Body)));
        Assert.All(notifications, n => Assert.Null(n.ReadAt));

        // The {OPENER_NAME} token in the seeded templates is substituted with the opener's display
        // name, so every broadcast body names who opened the Döner-Tag.
        Assert.All(notifications, n => Assert.Contains(chef.DisplayName, n.Body));
        Assert.All(notifications, n => Assert.DoesNotContain("{OPENER_NAME}", n.Body));
    }
}
