using FastEndpoints;
using Schulz.DoenerControl.Api.Auth;
using Schulz.DoenerControl.Application.Security;

namespace Schulz.DoenerControl.Api.Endpoints.Auth;

public sealed record RefreshResponse(string DisplayName, bool MustChangePassword);

// Rotates the refresh token read from the dc_refresh cookie and reissues all auth cookies (access +
// rotated refresh + a fresh CSRF token). Anonymous (the access token may already be expired) +
// throttled. A reused/expired/unknown token maps to 401; reuse detection revokes the user's tokens.
public sealed class Refresh : EndpointWithoutRequest<RefreshResponse>
{
    private readonly IAuthService authService;
    private readonly AuthSessionWriter sessionWriter;

    public Refresh(IAuthService authService, AuthSessionWriter sessionWriter)
    {
        this.authService = authService;
        this.sessionWriter = sessionWriter;
    }

    public override void Configure()
    {
        Post("/api/auth/refresh");
        AllowAnonymous();
        Throttle(hitLimit: 20, durationSeconds: 60);
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var rawToken = HttpContext.Request.Cookies[AuthCookies.RefreshCookie];
        if (string.IsNullOrEmpty(rawToken))
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var result = await authService.RefreshAsync(rawToken, ct);
        if (!result.IsSuccess)
        {
            sessionWriter.ClearSession(HttpContext.Response);
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var user = result.Value;
        sessionWriter.WriteSession(HttpContext.Response, user);
        await Send.OkAsync(
            new RefreshResponse(user.DisplayName, user.MustChangePassword),
            cancellation: ct
        );
    }
}
