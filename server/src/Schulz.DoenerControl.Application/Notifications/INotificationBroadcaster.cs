namespace Schulz.DoenerControl.Application.Notifications;

// Persists the open-day broadcast: one Notification row per OTHER active user, carrying the
// rendered synonym push text. Returns how many colleagues were notified (the mock's
// "Push an N Kollegen"). Kept narrow and separate from the notification-feed read service so the
// OrderDay open flow has a single, well-scoped composition point.
public interface INotificationBroadcaster
{
    Task<int> BroadcastDayOpenedAsync(
        Guid orderDayId,
        string title,
        string body,
        Guid openerUserId,
        CancellationToken ct
    );
}
