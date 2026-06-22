namespace Schulz.DoenerControl.Application.Orders;

// "Ich hole heute ab" as a single dashboard action that BOTH becomes the Abholer when nobody is AND
// takes the role over from someone else (they're in a meeting). The caller must already have an
// order on the open day. Forces the collector to the caller unconditionally — that is the take-over
// path. Returns the updated day projection relative to the caller.
public sealed record ClaimCollectorCommand(Guid CallerUserId, Guid OrderDayId);
