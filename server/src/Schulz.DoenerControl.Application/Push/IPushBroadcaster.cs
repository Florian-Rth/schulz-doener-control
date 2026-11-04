namespace Schulz.DoenerControl.Application.Push;

// Fans the open-day Web Push out to every OTHER active user's subscriptions (never the opener),
// carrying the rendered synonym push text. Separate from the in-app notification feed broadcaster so
// the OrderDay open flow composes the two side effects explicitly. Returns the number of pushes sent.
public interface IPushBroadcaster
{
    Task<int> BroadcastDayOpenedAsync(
        string title,
        string body,
        Guid openerUserId,
        CancellationToken ct
    );

    // Fans a push out to every active user's subscriptions (nobody excluded), e.g. the Glücksrad
    // verdict that everyone — including the chosen one — must hear about.
    Task<int> BroadcastToEveryoneAsync(string title, string body, CancellationToken ct);
}
