namespace Schulz.DoenerControl.Application.Profile;

// Updates or clears the caller's optional work email. A null or blank value clears it; a real value
// is stored verbatim (trimmed), not parsed — unlike the PayPal handle there is no link to unwrap.
public sealed record UpdateWorkEmailCommand(Guid CallerUserId, string? WorkEmail);
