using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Application.Profile;

// The caller's editable profile: the self-entered PayPal.Me handle plus the read-only display
// fields the SPA shows alongside it. FirstName and Initials are derived from DisplayName (never
// stored), mirroring the mock's initialsOf.
public sealed record ProfileDetails(
    Guid UserId,
    string DisplayName,
    string FirstName,
    string Initials,
    string AvatarColorHex,
    UserRole Role,
    string? PayPalHandle,
    bool PayPalHandleSet
);
