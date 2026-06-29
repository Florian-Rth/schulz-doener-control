using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Core.Entities;

public sealed class User
{
    public Guid Id { get; set; }

    public required string Username { get; set; }

    // Lower-invariant form of Username, carrying the unique index so login can resolve
    // case-insensitively without relying on collation behaviour.
    public required string NormalizedUserName { get; set; }

    public required string DisplayName { get; set; }

    // Nullable: a user can be provisioned before supplying their PayPal.Me handle.
    public string? PayPalHandle { get; set; }

    // Nullable: an optional work email a colleague may supply at registration or later in
    // settings; used to mail the order list as a PDF when the office printer is out of reach.
    public string? WorkEmail { get; set; }

    public required byte[] PasswordHash { get; set; }

    public required byte[] PasswordSalt { get; set; }

    public UserRole Role { get; set; }

    public bool IsActive { get; set; }

    public bool MustChangePassword { get; set; }

    public required string AvatarColorHex { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public ICollection<Order>? Orders { get; set; }

    public ICollection<RefreshToken>? RefreshTokens { get; set; }
}
