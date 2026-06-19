namespace Schulz.DoenerControl.Application.Push;

// Removes the caller's push subscription identified by its endpoint (e.g. on logout or when the
// browser revokes permission). Scoped to the caller so one user cannot delete another's subscription.
public sealed record RemovePushSubscriptionCommand(Guid CallerUserId, string Endpoint);
