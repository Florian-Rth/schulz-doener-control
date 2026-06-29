using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Application.Users;

// The caller's own profile, used to hydrate the SPA after a reload or silent refresh. FirstName
// and Initials are derived from DisplayName (never stored), mirroring the mock's initialsOf.
public sealed record CurrentUserDetails(
    Guid UserId,
    string DisplayName,
    string FirstName,
    string Initials,
    string AvatarColorHex,
    UserRole Role,
    string? PayPalHandle,
    bool PayPalHandleSet,
    string? WorkEmail,
    bool MustChangePassword
);
