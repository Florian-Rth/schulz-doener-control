namespace Schulz.DoenerControl.Core.Entities;

// A Web Push (VAPID) subscription for one user's device/browser. OpenDay fans out a push
// to every active user's subscriptions.
public sealed class PushSubscription
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    // The browser push service endpoint URL; unique so re-subscribing upserts.
    public required string Endpoint { get; set; }

    public required string P256dh { get; set; }

    public required string Auth { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public User? User { get; set; }
}
