using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Application.Users;
using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Api.Endpoints.Admin.Users;

public sealed class DeleteAdminUserRequest
{
    [RouteParam]
    public Guid Id { get; set; }
}

public sealed class DeleteAdminUserRequestValidator : Validator<DeleteAdminUserRequest>
{
    public DeleteAdminUserRequestValidator()
    {
        RuleFor(request => request.Id).NotEmpty();
    }
}

// Soft-deactivates an account (IsActive=false) so its Order/Debt history stays intact, revoking its
// refresh tokens. Refuses (409) to deactivate the last active admin. Idempotent: an already-inactive
// account still returns 204. Admin-only.
public sealed class DeleteAdminUser : Endpoint<DeleteAdminUserRequest>
{
    private readonly IUserService userService;

    public DeleteAdminUser(IUserService userService)
    {
        this.userService = userService;
    }

    public override void Configure()
    {
        Delete("/api/admin/users/{Id}");
        Roles("Admin");
    }

    public override async Task HandleAsync(DeleteAdminUserRequest req, CancellationToken ct)
    {
        var result = await userService.DeactivateAsync(req.Id, ct);
        if (!result.IsSuccess)
        {
            if (result.Error is { } message)
                AddError(message);

            await SendFailureAsync(result.Status, ct);
            return;
        }

        await Send.NoContentAsync(ct);
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
