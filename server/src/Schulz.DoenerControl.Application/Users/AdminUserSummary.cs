using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Application.Users;

// One row in the admin user-management list. Carries the full administrative view of an account
// (role, active/forced-change flags, PayPal handle) that the admin screen needs to render and act
// on — distinct from the self-profile CurrentUserDetails which is scoped to the caller.
public sealed record AdminUserSummary(
    Guid Id,
    string Username,
    string DisplayName,
    UserRole Role,
    bool IsActive,
    bool MustChangePassword,
    string? PayPalHandle,
    DateTimeOffset CreatedAt
);
