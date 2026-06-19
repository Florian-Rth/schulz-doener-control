using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Application.Users;

// Admin edit of an existing account. Username is immutable (it anchors login and the unique index),
// so it is not part of the command. Role and IsActive can flip; both are guarded against demoting
// or deactivating the last remaining active admin.
public sealed record UpdateUserCommand(
    Guid UserId,
    string DisplayName,
    string? PayPalHandle,
    UserRole Role,
    bool IsActive
);
