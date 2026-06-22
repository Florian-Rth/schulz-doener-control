using System.Text.RegularExpressions;
using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Application.Users;
using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Api.Endpoints.Auth;

public sealed record RegisterRequest(
    string Username,
    string DisplayName,
    string? PayPalHandle,
    string Password,
    string? InviteCode
);

public sealed record RegisterResponse(Guid UserId, string Username, string DisplayName);

public sealed partial class RegisterRequestValidator : Validator<RegisterRequest>
{
    // Login-username charset, matching the seeded "f.lastname" style: letters, digits and the
    // separators . _ - only. Uniqueness is enforced case-insensitively by the service.
    [GeneratedRegex("^[A-Za-z0-9._-]+$")]
    private static partial Regex UsernamePattern();

    [GeneratedRegex("^[A-Za-z0-9]+$")]
    private static partial Regex HandlePattern();

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
            () =>
                RuleFor(request => request.PayPalHandle)
                    .MaximumLength(40)
                    .Must(handle => HandlePattern().IsMatch(handle!))
                    .WithMessage("Der PayPal.Me-Name darf nur Buchstaben und Ziffern enthalten.")
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

        // The invite code is optional: only required (and matched) when one is configured
        // server-side. Length-bounded purely to reject obviously malformed input.
        RuleFor(request => request.InviteCode).MaximumLength(128);
    }

    private static bool HasLetterAndDigit(string password) =>
        password.Any(char.IsLetter) && password.Any(char.IsDigit);
}

// Public self-registration for the printed QR-code flow: anonymous, per-IP throttled, and (when a
// shared code is configured server-side) gated by the invite code embedded in the QR-code URL — a
// mismatch is a 403. The colleague picks their own username, display name and password; the account
// is always created as an active Employee with no forced password change (they already chose the
// password). A case-insensitively duplicate username is a 409. No auth cookies are issued here —
// the colleague logs in afterward with the credentials they just chose.
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
            req.InviteCode
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
