using FastEndpoints;
using Schulz.DoenerControl.Api.Auth;
using Schulz.DoenerControl.Application.Security;

namespace Schulz.DoenerControl.Api.Endpoints.Auth;

// Revokes the caller's refresh tokens and clears all three cookies. Authenticated and reachable
// even while MustChangePassword is set (the gate exempts it) so a locked account can still sign out.
public sealed class Logout : EndpointWithoutRequest
{
    private readonly IAuthService authService;
    private readonly ICurrentUser currentUser;
    private readonly AuthSessionWriter sessionWriter;

    public Logout(
        IAuthService authService,
        ICurrentUser currentUser,
        AuthSessionWriter sessionWriter
    )
    {
        this.authService = authService;
        this.currentUser = currentUser;
        this.sessionWriter = sessionWriter;
    }

    public override void Configure()
    {
        Post("/api/auth/logout");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        if (currentUser.UserId is { } callerId)
        {
            var rawToken = HttpContext.Request.Cookies[AuthCookies.RefreshCookie];
            await authService.LogoutAsync(new LogoutCommand(callerId, rawToken), ct);
        }

        sessionWriter.ClearSession(HttpContext.Response);
        await Send.NoContentAsync(ct);
    }
}
