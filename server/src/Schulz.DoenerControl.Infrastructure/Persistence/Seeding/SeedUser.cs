using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Infrastructure.Persistence.Seeding;

internal sealed record SeedUser(
    string Username,
    string DisplayName,
    string AvatarColorHex,
    UserRole Role,
    string? PayPalHandle,
    bool MustChangePassword
);
