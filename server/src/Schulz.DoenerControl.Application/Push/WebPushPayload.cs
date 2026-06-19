namespace Schulz.DoenerControl.Application.Push;

// The notification content delivered to a subscriber. Title + body mirror the in-app feed row so the
// browser push and the foreground toast read identically (the rendered synonym sentence).
public sealed record WebPushPayload(string Title, string Body);
