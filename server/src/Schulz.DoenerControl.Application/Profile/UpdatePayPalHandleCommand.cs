namespace Schulz.DoenerControl.Application.Profile;

// Captures, updates, or clears the caller's PayPal.Me handle. A null (or blank) Handle clears it,
// so the payment buttons disable again. CallerUserId comes from the validated JWT, never the body.
public sealed record UpdatePayPalHandleCommand(Guid CallerUserId, string? Handle);
