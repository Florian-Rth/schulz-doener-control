using System.Text.RegularExpressions;
using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Api.Validation;
using Schulz.DoenerControl.Application.Users;
using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Api.Endpoints.Auth;

// SecretKey is the shared secret the SecretKeyOnly registration mode requires (carried in the
// QR-code URL). Code and InviteCode are backward-compat aliases for the same value — older clients
// (and the printed QR links) send those field names; the endpoint coalesces all three. No URL
// change.
public sealed record RegisterRequest(
    string Username,
    string DisplayName,
    string? PayPalHandle,
    string Password,
    string? SecretKey,
    string? Code,
    string? InviteCode
);

public sealed record RegisterResponse(Guid UserId, string Username, string DisplayName);

public sealed partial class RegisterRequestValidator : Validator<RegisterRequest>
{
    // Login-username charset, matching the seeded "f.lastname" style: letters, digits and the
    // separators . _ - only. Uniqueness is enforced case-insensitively by the service.
    [GeneratedRegex("^[A-Za-z0-9._-]+$")]
    private static partial Regex UsernamePattern();

    public RegisterRequestValidator()
    {
        RuleFor(request => request.Username)
            .NotEmpty()
            .WithMessage("Der Benutzername darf nicht leer sein.")
            .MinimumLength(2)
            .MaximumLength(64)
            .Must(username => UsernamePattern().IsMatch(username))
            .WithMessage("Der Benutzername darf nur Buchstaben, Ziffern und . _ - enthalten.");

        RuleFor(request => request.DisplayName)
            .NotEmpty()
            .WithMessage("Der Anzeigename darf nicht leer sein.")
            .MaximumLength(128);

        When(
            request => !string.IsNullOrWhiteSpace(request.PayPalHandle),
            () => RuleFor(request => request.PayPalHandle).PayPalLink()
        );

        // Same rules as the self-service password change: minimum length plus at least one letter
        // and one digit.
        RuleFor(request => request.Password)
            .NotEmpty()
            .MinimumLength(10)
            .MaximumLength(256)
            .Must(HasLetterAndDigit)
            .WithMessage(
                "Das Passwort muss mindestens einen Buchstaben und eine Ziffer enthalten."
            );

        // The secret key (and its aliases) is optional: only required and matched when the runtime
        // registration mode is SecretKeyOnly. Length-bounded purely to reject malformed input.
        RuleFor(request => request.SecretKey).MaximumLength(128);
        RuleFor(request => request.Code).MaximumLength(128);
        RuleFor(request => request.InviteCode).MaximumLength(128);
    }

    private static bool HasLetterAndDigit(string password) =>
        password.Any(char.IsLetter) && password.Any(char.IsDigit);
}

// Public self-registration for the printed QR-code flow: anonymous, per-IP throttled, and gated by
// the runtime registration mode (Enabled/Disabled/SecretKeyOnly). When SecretKeyOnly is active the
// shared secret from the QR-code URL must match — a mismatch (or a Disabled mode) is a 403. The
// colleague picks their own username, display name and password; the account is always created as an
// active Employee with no forced password change (they already chose the password). A
// case-insensitively duplicate username is a 409. No auth cookies are issued here — the colleague
// logs in afterward with the credentials they just chose.
public sealed class Register : Endpoint<RegisterRequest, RegisterResponse>
{
    private readonly IUserService userService;

    public Register(IUserService userService)
    {
        this.userService = userService;
    }

    public override void Configure()
    {
        Post("/api/auth/register");
        AllowAnonymous();
        Throttle(hitLimit: 5, durationSeconds: 300);
    }

    public override async Task HandleAsync(RegisterRequest req, CancellationToken ct)
    {
        var command = new SelfRegisterCommand(
            req.Username,
            req.DisplayName,
            req.PayPalHandle,
            req.Password,
            CoalesceSecretKey(req)
        );

        var result = await userService.SelfRegisterAsync(command, ct);
        if (!result.IsSuccess)
        {
            if (result.Error is { } message)
                AddError(message);

            await SendFailureAsync(result.Status, ct);
            return;
        }

        var registered = result.Value;
        await Send.ResponseAsync(
            new RegisterResponse(registered.UserId, registered.Username, registered.DisplayName),
            StatusCodes.Status201Created,
            ct
        );
    }

    // Accepts the shared secret under its current name or either legacy alias, preferring the first
    // non-blank one so old clients (code/inviteCode) and the new field (secretKey) all work.
    private static string? CoalesceSecretKey(RegisterRequest req)
    {
        if (!string.IsNullOrWhiteSpace(req.SecretKey))
            return req.SecretKey;
        if (!string.IsNullOrWhiteSpace(req.Code))
            return req.Code;
        if (!string.IsNullOrWhiteSpace(req.InviteCode))
            return req.InviteCode;
        return null;
    }

    private async Task SendFailureAsync(ResultStatus status, CancellationToken ct)
    {
        switch (status)
        {
            case ResultStatus.Conflict:
                await Send.ErrorsAsync(StatusCodes.Status409Conflict, cancellation: ct);
                break;
            case ResultStatus.Forbidden:
                await Send.ErrorsAsync(StatusCodes.Status403Forbidden, cancellation: ct);
                break;
            default:
                await Send.ErrorsAsync(cancellation: ct);
                break;
        }
    }
}
