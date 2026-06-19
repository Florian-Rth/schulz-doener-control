namespace Schulz.DoenerControl.Application.Push;

// Stores (upserts) a browser push subscription for the authenticated caller. The endpoint is the
// natural key — re-subscribing the same device replaces its keys rather than duplicating the row.
public sealed record SavePushSubscriptionCommand(
    Guid CallerUserId,
    string Endpoint,
    string P256dh,
    string Auth
);
