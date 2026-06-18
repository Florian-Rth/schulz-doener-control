using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Api.Auth;
using Schulz.DoenerControl.Application.Security;
using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Api.Endpoints.Auth;

public sealed record LoginRequest(string Username, string Password);

public sealed record LoginResponse(
    string DisplayName,
    bool MustChangePassword,
    bool PayPalHandleSet
);

public sealed class LoginRequestValidator : Validator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(request => request.Username).NotEmpty().MaximumLength(64);
        RuleFor(request => request.Password).NotEmpty().MaximumLength(256);
    }
}

// Authenticates, sets the three auth cookies, and returns routing hints (no token in the body).
// Anonymous + per-IP throttled. Every credential failure maps to 401 so the client cannot tell
// which factor failed.
public sealed class Login : Endpoint<LoginRequest, LoginResponse>
{
    private readonly IAuthService authService;
    private readonly AuthSessionWriter sessionWriter;

    public Login(IAuthService authService, AuthSessionWriter sessionWriter)
    {
        this.authService = authService;
        this.sessionWriter = sessionWriter;
    }

    public override void Configure()
    {
        Post("/api/auth/login");
        AllowAnonymous();
        Throttle(hitLimit: 10, durationSeconds: 60);
    }

    public override async Task HandleAsync(LoginRequest req, CancellationToken ct)
    {
        var command = new LoginCommand(req.Username, req.Password);
        var result = await authService.LoginAsync(command, ct);

        if (!result.IsSuccess)
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var user = result.Value;
        sessionWriter.WriteSession(HttpContext.Response, user);
        await Send.OkAsync(MapToResponse(user), cancellation: ct);
    }

    private static LoginResponse MapToResponse(AuthenticatedUserDetails user) =>
        new(user.DisplayName, user.MustChangePassword, user.PayPalHandleSet);
}
