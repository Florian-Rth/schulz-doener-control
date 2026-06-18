using System.Security.Claims;
using FastEndpoints;

namespace Schulz.DoenerControl.Api.Auth;

// Forced-change gate. While the caller's access token carries must_change=true, every authenticated
// endpoint is blocked with 403 except change-password and logout, so a freshly provisioned account
// can only set a new password (or sign out) until the flag clears. Anonymous endpoints never get
// this processor attached.
public sealed class MustChangePasswordGate : IGlobalPreProcessor
{
    private const string ChangePasswordPath = "/api/auth/change-password";
    private const string LogoutPath = "/api/auth/logout";

    public async Task PreProcessAsync(IPreProcessorContext ctx, CancellationToken ct)
    {
        var http = ctx.HttpContext;

        if (IsAllowedWhileLocked(http.Request.Path))
            return;

        if (!MustChange(http.User))
            return;

        if (!http.ResponseStarted())
            await http.Response.SendForbiddenAsync(ct);
    }

    private static bool IsAllowedWhileLocked(PathString path) =>
        path.Equals(ChangePasswordPath, StringComparison.OrdinalIgnoreCase)
        || path.Equals(LogoutPath, StringComparison.OrdinalIgnoreCase);

    private static bool MustChange(ClaimsPrincipal user) =>
        string.Equals(
            user.FindFirstValue(AuthClaims.MustChangePassword),
            "true",
            StringComparison.OrdinalIgnoreCase
        );
}
