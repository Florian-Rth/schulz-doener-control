using System.Net;
using System.Net.Http.Json;
using FastEndpoints.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Schulz.DoenerControl.Api.Tests.Auth;
using Schulz.DoenerControl.Application.Calculators;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Infrastructure.Persistence;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Push;

// F19 first-failing test: a subscription POSTed by the caller is stored; opening a day fans a Web
// Push (the synonym body) to every OTHER active subscriber via the transport double — never to the
// opener; DELETE removes the caller's subscription.
public sealed class PushSubscriptionTests : TestBase<PushTestApp>
{
    private const string LoginUrl = "/api/auth/login";
    private const string SubscriptionsUrl = "/api/push/subscriptions";
    private const string OpenUrl = "/api/order-days/open";

    private readonly PushTestApp app;

    public PushSubscriptionTests(PushTestApp app)
    {
        this.app = app;
    }

    [Fact]
    public async Task Should_Store_Push_Subscription_When_Posted_By_Caller()
    {
        var auth = await LoginAsChefAsync();

        // The W3C PushSubscription.toJSON() wire shape: keys nested under `keys`.
        var response = await auth.PostJsonAsync(
            SubscriptionsUrl,
            new
            {
                Endpoint = "https://push.example.com/chef-device",
                ExpirationTime = (long?)null,
                Keys = new { P256dh = "chef-p256dh-key", Auth = "chef-auth-secret" },
            }
        );

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var echoed = await response.Content.ReadFromJsonAsync<PostSubscriptionResponseBody>(
            TestContext.Current.CancellationToken
        );
        Assert.NotNull(echoed);
        Assert.Equal("https://push.example.com/chef-device", echoed!.Endpoint);

        var chefId = await ResolveUserIdAsync("m.wagner");
        using var scope = app.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var stored = await database.PushSubscriptions.SingleAsync(
            subscription => subscription.UserId == chefId,
            TestContext.Current.CancellationToken
        );
        Assert.Equal("https://push.example.com/chef-device", stored.Endpoint);
        Assert.Equal("chef-p256dh-key", stored.P256dh);
        Assert.Equal("chef-auth-secret", stored.Auth);
    }

    [Fact]
    public async Task Should_Push_Synonym_To_Other_Subscribers_But_Not_Opener_When_Day_Opens()
    {
        var chefId = await ResolveUserIdAsync("m.wagner");
        var colleagueId = await ResolveOtherActiveUserIdAsync(chefId);

        // The colleague is subscribed; the opener (chef) is also subscribed but must NOT be pushed.
        // Endpoints are unique to this test so they never collide with the other tests in this class
        // that subscribe the chef against the shared per-class database (Endpoint is uniquely indexed).
        const string colleagueEndpoint = "https://push.example.com/synonym-colleague-device";
        const string chefEndpoint = "https://push.example.com/synonym-chef-device";
        await InsertSubscriptionAsync(
            colleagueId,
            colleagueEndpoint,
            "colleague-p256",
            "colleague-auth"
        );
        await InsertSubscriptionAsync(chefId, chefEndpoint, "chef-p256", "chef-auth");

        var auth = await LoginAsChefAsync();
        var response = await auth.PostAsync(OpenUrl);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadFromJsonAsync<OpenDayResponseBody>(
            TestContext.Current.CancellationToken
        );
        Assert.NotNull(body);

        var sends = app.Transport.Sends;
        // Exactly one push: to the subscribed colleague, never the opener.
        Assert.Single(sends);
        var sent = sends[0];
        Assert.Equal(colleagueEndpoint, sent.Target.Endpoint);

        var expectedBody = PushTextBuilder.BuildOpenDayBody(body!.Day.Synonym);
        Assert.Equal(expectedBody, sent.Payload.Body);
        Assert.DoesNotContain(sends, s => s.Target.Endpoint == chefEndpoint);
    }

    [Fact]
    public async Task Should_Remove_Push_Subscription_When_Deleted_By_Caller()
    {
        var auth = await LoginAsChefAsync();
        const string endpoint = "https://push.example.com/chef-delete-device";
        await auth.PostJsonAsync(
            SubscriptionsUrl,
            new
            {
                Endpoint = endpoint,
                ExpirationTime = (long?)null,
                Keys = new { P256dh = "chef-p256dh-key", Auth = "chef-auth-secret" },
            }
        );

        // The FE sends the endpoint as a ?endpoint=... query param (bound via [QueryParam]).
        var response = await auth.DeleteAsync(
            $"{SubscriptionsUrl}?endpoint={Uri.EscapeDataString(endpoint)}"
        );

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        using var scope = app.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var exists = await database.PushSubscriptions.AnyAsync(
            subscription => subscription.Endpoint == endpoint,
            TestContext.Current.CancellationToken
        );
        Assert.False(exists);
    }

    private async Task<AuthTestClient> LoginAsChefAsync()
    {
        var auth = new AuthTestClient(app.CreateClient());
        await auth.PostJsonAsync(
            LoginUrl,
            new { Username = "m.wagner", Password = "doener-dev-2026" }
        );
        return auth;
    }

    private async Task<Guid> ResolveUserIdAsync(string normalizedUserName)
    {
        using var scope = app.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return await database
            .Users.Where(user => user.NormalizedUserName == normalizedUserName)
            .Select(user => user.Id)
            .SingleAsync(TestContext.Current.CancellationToken);
    }

    private async Task<Guid> ResolveOtherActiveUserIdAsync(Guid excludeId)
    {
        using var scope = app.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return await database
            .Users.Where(user => user.IsActive && user.Id != excludeId)
            .Select(user => user.Id)
            .OrderBy(id => id)
            .FirstAsync(TestContext.Current.CancellationToken);
    }

    private async Task InsertSubscriptionAsync(
        Guid userId,
        string endpoint,
        string p256dh,
        string secret
    )
    {
        using var scope = app.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        database.PushSubscriptions.Add(
            new PushSubscription
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Endpoint = endpoint,
                P256dh = p256dh,
                Auth = secret,
                CreatedAt = DateTimeOffset.UtcNow,
            }
        );
        await database.SaveChangesAsync(TestContext.Current.CancellationToken);
    }

    private sealed record OpenDayResponseBody(OpenDayDayBody Day, int NotifiedColleagueCount);

    private sealed record OpenDayDayBody(string Synonym);

    private sealed record PostSubscriptionResponseBody(string Endpoint);
}
