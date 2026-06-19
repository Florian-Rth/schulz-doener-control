using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Application.Users;

// Admin request to provision a new account. The server owns the credential: it generates the
// temporary password, so no plaintext is ever accepted here. Role defaults to Employee at the
// endpoint boundary.
public sealed record CreateUserCommand(
    string Username,
    string DisplayName,
    string? PayPalHandle,
    UserRole Role
);
