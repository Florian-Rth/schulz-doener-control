using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Api.Validation;
using Schulz.DoenerControl.Application.Users;
using Schulz.DoenerControl.Core;
using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Api.Endpoints.Admin.Users;

public sealed class PutAdminUserRequest
{
    [RouteParam]
    public Guid Id { get; set; }

    public string DisplayName { get; set; } = string.Empty;

    public string? PayPalHandle { get; set; }

    public UserRole Role { get; set; }

    public bool IsActive { get; set; }
}

public sealed record PutAdminUserResponse(AdminUserSummaryDto User);

public sealed class PutAdminUserRequestValidator : Validator<PutAdminUserRequest>
{
    public PutAdminUserRequestValidator()
    {
        RuleFor(request => request.Id).NotEmpty();

        RuleFor(request => request.DisplayName)
            .NotEmpty()
            .WithMessage("Der Anzeigename darf nicht leer sein.")
            .MaximumLength(128);

        RuleFor(request => request.Role).IsInEnum();

        When(
            request => !string.IsNullOrWhiteSpace(request.PayPalHandle),
            () => RuleFor(request => request.PayPalHandle).PayPalLink()
        );
    }
}

// Edits an existing account's display name, PayPal handle, role and active flag. Refuses (409) to
// demote or deactivate the last active admin, and revokes the account's refresh tokens on any role
// change or deactivation so the affected sessions must re-authenticate. Admin-only.
public sealed class PutAdminUser : Endpoint<PutAdminUserRequest, PutAdminUserResponse>
{
    private readonly IUserService userService;

    public PutAdminUser(IUserService userService)
    {
        this.userService = userService;
    }

    public override void Configure()
    {
        Put("/api/admin/users/{Id}");
        Roles("Admin");
    }

    public override async Task HandleAsync(PutAdminUserRequest req, CancellationToken ct)
    {
        var command = new UpdateUserCommand(
            req.Id,
            req.DisplayName,
            req.PayPalHandle,
            req.Role,
            req.IsActive
        );

        var result = await userService.UpdateAsync(command, ct);
        if (!result.IsSuccess)
        {
            if (result.Error is { } message)
                AddError(message);

            await SendFailureAsync(result.Status, ct);
            return;
        }

        await Send.OkAsync(
            new PutAdminUserResponse(AdminUserMapper.ToSummaryDto(result.Value)),
            cancellation: ct
        );
    }

    private async Task SendFailureAsync(ResultStatus status, CancellationToken ct)
    {
        switch (status)
        {
            case ResultStatus.NotFound:
                await Send.NotFoundAsync(ct);
                break;
            case ResultStatus.Conflict:
                await Send.ErrorsAsync(StatusCodes.Status409Conflict, cancellation: ct);
                break;
            default:
                await Send.ErrorsAsync(cancellation: ct);
                break;
        }
    }
}
