using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Application.Security;

// The successful result of authenticating (login or refresh): the identity the endpoint needs to
// mint the access JWT plus the routing hints the SPA needs. Carries the freshly issued raw refresh
// token so the endpoint can place it in the rotating refresh cookie — only the hash is ever stored.
public sealed record AuthenticatedUserDetails(
    Guid UserId,
    string Username,
    string DisplayName,
    UserRole Role,
    bool MustChangePassword,
    bool PayPalHandleSet,
    string RawRefreshToken
);
