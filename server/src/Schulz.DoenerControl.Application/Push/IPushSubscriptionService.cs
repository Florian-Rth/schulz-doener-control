using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Application.Push;

// Stores and removes a user's Web Push subscriptions. Subscribe upserts on the unique endpoint;
// unsubscribe is idempotent (removing an unknown endpoint succeeds, so logout never errors).
public interface IPushSubscriptionService
{
    Task<Result> SubscribeAsync(SavePushSubscriptionCommand command, CancellationToken ct);

    Task<Result> UnsubscribeAsync(RemovePushSubscriptionCommand command, CancellationToken ct);
}
