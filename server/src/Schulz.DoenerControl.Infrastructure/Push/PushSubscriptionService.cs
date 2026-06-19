using Microsoft.EntityFrameworkCore;
using Schulz.DoenerControl.Application.Push;
using Schulz.DoenerControl.Core;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Infrastructure.Persistence;

namespace Schulz.DoenerControl.Infrastructure.Push;

public sealed class PushSubscriptionService : IPushSubscriptionService
{
    private readonly AppDbContext database;
    private readonly TimeProvider timeProvider;

    public PushSubscriptionService(AppDbContext database, TimeProvider timeProvider)
    {
        this.database = database;
        this.timeProvider = timeProvider;
    }

    public async Task<Result> SubscribeAsync(
        SavePushSubscriptionCommand command,
        CancellationToken ct
    )
    {
        // The endpoint is the device's natural key. Re-subscribing the same endpoint updates its keys
        // and re-points it at the current caller rather than inserting a duplicate (unique index).
        var existing = await database.PushSubscriptions.FirstOrDefaultAsync(
            subscription => subscription.Endpoint == command.Endpoint,
            ct
        );

        if (existing is null)
        {
            database.PushSubscriptions.Add(
                new PushSubscription
                {
                    Id = Guid.NewGuid(),
                    UserId = command.CallerUserId,
                    Endpoint = command.Endpoint,
                    P256dh = command.P256dh,
                    Auth = command.Auth,
                    CreatedAt = timeProvider.GetUtcNow(),
                }
            );
        }
        else
        {
            existing.UserId = command.CallerUserId;
            existing.P256dh = command.P256dh;
            existing.Auth = command.Auth;
        }

        await database.SaveChangesAsync(ct);
        return Result.Success();
    }

    public async Task<Result> UnsubscribeAsync(
        RemovePushSubscriptionCommand command,
        CancellationToken ct
    )
    {
        // Idempotent and caller-scoped: deleting an unknown or another user's endpoint is a no-op so
        // logout never fails, and one user can never remove another's subscription.
        var existing = await database.PushSubscriptions.FirstOrDefaultAsync(
            subscription =>
                subscription.Endpoint == command.Endpoint
                && subscription.UserId == command.CallerUserId,
            ct
        );

        if (existing is not null)
        {
            database.PushSubscriptions.Remove(existing);
            await database.SaveChangesAsync(ct);
        }

        return Result.Success();
    }
}
