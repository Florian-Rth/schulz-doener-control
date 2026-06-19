using Microsoft.EntityFrameworkCore;
using Schulz.DoenerControl.Application.Push;
using Schulz.DoenerControl.Infrastructure.Persistence;

namespace Schulz.DoenerControl.Infrastructure.Push;

// Sends the open-day Web Push to every OTHER active user's subscriptions. Runs after the OrderDay is
// committed, so a push is never delivered for a day that lost the open race. A single subscriber's
// transport failure (e.g. an expired endpoint) is swallowed so the rest of the fan-out still lands.
public sealed class PushBroadcaster : IPushBroadcaster
{
    private readonly AppDbContext database;
    private readonly IWebPushTransport transport;

    public PushBroadcaster(AppDbContext database, IWebPushTransport transport)
    {
        this.database = database;
        this.transport = transport;
    }

    public async Task<int> BroadcastDayOpenedAsync(
        string title,
        string body,
        Guid openerUserId,
        CancellationToken ct
    )
    {
        var targets = await database
            .PushSubscriptions.AsNoTracking()
            .Where(subscription =>
                subscription.UserId != openerUserId
                && subscription.User != null
                && subscription.User.IsActive
            )
            .Select(subscription => new WebPushTarget(
                subscription.Endpoint,
                subscription.P256dh,
                subscription.Auth
            ))
            .ToListAsync(ct);

        var payload = new WebPushPayload(title, body);
        var sent = 0;
        foreach (var target in targets)
        {
            try
            {
                await transport.SendAsync(target, payload, ct);
                sent++;
            }
            catch (Exception) when (!ct.IsCancellationRequested)
            {
                // One dead subscription must not stop the rest of the fan-out; skip and continue.
            }
        }

        return sent;
    }
}
