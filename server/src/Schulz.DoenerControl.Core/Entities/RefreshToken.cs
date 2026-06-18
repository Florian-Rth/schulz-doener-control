namespace Schulz.DoenerControl.Core.Entities;

// Backs JWT refresh-with-rotation. The raw token is never stored, only its hash.
public sealed class RefreshToken
{
    public Guid Id { get; set; }

    public Guid UserId { get; set; }

    public required byte[] TokenHash { get; set; }

    public DateTimeOffset ExpiresAt { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? RevokedAt { get; set; }

    public byte[]? ReplacedByTokenHash { get; set; }

    public User? User { get; set; }
}
