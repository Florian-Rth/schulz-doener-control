using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Application.Profile;

// The caller's editable profile. PayPalHandle carries the user-facing PayPal LINK (reconstructed
// from the stored handle) — the user only ever sees/edits a link; PayPalHandleSet reflects handle
// presence. The read-only display fields FirstName and Initials are derived from DisplayName (never
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
