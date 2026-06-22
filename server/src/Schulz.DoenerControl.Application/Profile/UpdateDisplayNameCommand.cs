namespace Schulz.DoenerControl.Application.Profile;

// Self-service rename of the caller's own display name. UserId comes from the validated JWT, never
// the body. The name is trimmed before it is stored; Initials and FirstName are re-derived for the
// response.
public sealed record UpdateDisplayNameCommand(Guid UserId, string DisplayName);
