using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Application.Security;

// Credential verification + refresh-token lifecycle. Authentication failures are surfaced as
// Result.Validation (the endpoint deliberately maps every auth failure to HTTP 401 so the client
// cannot tell which factor failed); authorization is enforced separately by the auth layer.
public interface IAuthService
{
    Task<Result<AuthenticatedUserDetails>> LoginAsync(LoginCommand command, CancellationToken ct);

    // Rotates the presented refresh token. A reused (already-revoked) token triggers reuse
    // detection: every refresh token for that user is revoked and the call fails.
    Task<Result<AuthenticatedUserDetails>> RefreshAsync(
        string rawRefreshToken,
        CancellationToken ct
    );

    Task<Result> LogoutAsync(LogoutCommand command, CancellationToken ct);

    // Sets the new password and clears the forced-change flag. The caller stays authenticated: every
    // OTHER refresh token is revoked, but a fresh replacement token is minted and returned alongside
    // the updated details so the endpoint can re-issue a session whose access token carries
    // must_change=false.
    Task<Result<AuthenticatedUserDetails>> ChangePasswordAsync(
        ChangePasswordCommand command,
        CancellationToken ct
    );
}
