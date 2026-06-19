using System.Security.Claims;
using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Api.Auth;
using Schulz.DoenerControl.Application.Security;

namespace Schulz.DoenerControl.Api.Endpoints.Auth;

// CurrentPassword is omitted on the forced first-login change and required on the self-service
// change. Whether the caller is forced is decided server-side from the must_change access-token
// claim (server-issued and signed), never from a client-supplied flag.
public sealed record ChangePasswordRequest(string? CurrentPassword, string NewPassword);

public sealed class ChangePasswordRequestValidator : Validator<ChangePasswordRequest>
{
    public ChangePasswordRequestValidator()
    {
        When(
            _ => !CallerIsForced(),
            () =>
            {
                RuleFor(request => request.CurrentPassword).NotEmpty().MaximumLength(256);
                RuleFor(request => request.NewPassword)
                    .NotEqual(request => request.CurrentPassword)
                    .WithMessage("Das neue Passwort muss sich vom aktuellen unterscheiden.");
            }
        );

        RuleFor(request => request.NewPassword)
            .NotEmpty()
            .MinimumLength(10)
            .MaximumLength(256)
            .Must(HasLetterAndDigit)
            .WithMessage(
                "Das neue Passwort muss mindestens einen Buchstaben und eine Ziffer enthalten."
            );
    }

    private static bool HasLetterAndDigit(string password) =>
        password.Any(char.IsLetter) && password.Any(char.IsDigit);

    private bool CallerIsForced() =>
        string.Equals(
            Resolve<IHttpContextAccessor>()
                .HttpContext?.User.FindFirstValue(AuthClaims.MustChangePassword),
            "true",
            StringComparison.OrdinalIgnoreCase
        );
}

// Self-sets a new password. The only authenticated endpoint reachable while MustChangePassword is
// set. On the self-service path it verifies the current password (wrong -> 401); on the forced
// first-login path (MustChangePassword set) the current password is neither required nor verified,
// since the caller just authenticated at login. It clears the flag and revokes every OTHER refresh
// token so other sessions must re-login, but keeps THIS caller signed in: the service returns a
// fresh refresh token and updated details, and we re-issue all three auth cookies. The new access
// token carries must_change=false, so the immutable old JWT's stale claim no longer matters.
public sealed class ChangePassword : Endpoint<ChangePasswordRequest>
{
    private readonly IAuthService authService;
    private readonly ICurrentUser currentUser;
    private readonly AuthSessionWriter sessionWriter;

    public ChangePassword(
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
        Post("/api/auth/change-password");
    }

    public override async Task HandleAsync(ChangePasswordRequest req, CancellationToken ct)
    {
        if (currentUser.UserId is not { } callerId)
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var command = new ChangePasswordCommand(callerId, req.CurrentPassword, req.NewPassword);
        var result = await authService.ChangePasswordAsync(command, ct);

        if (!result.IsSuccess)
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        sessionWriter.WriteSession(HttpContext.Response, result.Value);
        await Send.NoContentAsync(ct);
    }
}
