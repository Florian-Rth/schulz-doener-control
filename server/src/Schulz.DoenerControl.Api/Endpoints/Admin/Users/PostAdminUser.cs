using System.Text.RegularExpressions;
using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Application.Users;
using Schulz.DoenerControl.Core;
using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Api.Endpoints.Admin.Users;

public sealed record PostAdminUserRequest(
    string Username,
    string DisplayName,
    string? PayPalHandle,
    UserRole? Role
);

// Returned EXACTLY ONCE: the generated temporary password is never persisted in plaintext and
// cannot be recovered, so the admin must hand it over now.
public sealed record PostAdminUserResponse(Guid UserId, string Username, string TemporaryPassword);

public sealed partial class PostAdminUserRequestValidator : Validator<PostAdminUserRequest>
{
    // Login-username charset, matching the seeded "f.lastname" style: letters, digits and the
    // separators . _ - only. Login resolves case-insensitively (via NormalizedUserName), so casing
    // here is cosmetic and uniqueness is enforced case-insensitively by the service.
    [GeneratedRegex("^[A-Za-z0-9._-]+$")]
    private static partial Regex UsernamePattern();

    [GeneratedRegex("^[A-Za-z0-9]+$")]
    private static partial Regex HandlePattern();

    public PostAdminUserRequestValidator()
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
                    .WithMessage("Der PayPal-Name darf nur Buchstaben und Ziffern enthalten.")
        );
    }
}

// Provisions a new account: the server generates a readable one-time password, hashes it, and
// returns it once. The new account is active and must change its password on first login. A
// case-insensitively duplicate username is a 409. Admin-only.
public sealed class PostAdminUser : Endpoint<PostAdminUserRequest, PostAdminUserResponse>
{
    private readonly IUserService userService;

    public PostAdminUser(IUserService userService)
    {
        this.userService = userService;
    }

    public override void Configure()
    {
        Post("/api/admin/users");
        Roles("Admin");
    }

    public override async Task HandleAsync(PostAdminUserRequest req, CancellationToken ct)
    {
        var command = new CreateUserCommand(
            req.Username,
            req.DisplayName,
            req.PayPalHandle,
            req.Role ?? UserRole.Employee
        );

        var result = await userService.CreateAsync(command, ct);
        if (!result.IsSuccess)
        {
            if (result.Error is { } message)
                AddError(message);

            await SendFailureAsync(result.Status, ct);
            return;
        }

        var created = result.Value;
        await Send.CreatedAtAsync<GetAdminUsers>(
            routeValues: null,
            responseBody: new PostAdminUserResponse(
                created.UserId,
                created.Username,
                created.TemporaryPassword
            ),
            generateAbsoluteUrl: false,
            cancellation: ct
        );
    }

    private async Task SendFailureAsync(ResultStatus status, CancellationToken ct)
    {
        switch (status)
        {
            case ResultStatus.Conflict:
                await Send.ErrorsAsync(StatusCodes.Status409Conflict, cancellation: ct);
                break;
            default:
                await Send.ErrorsAsync(cancellation: ct);
                break;
        }
    }
}
