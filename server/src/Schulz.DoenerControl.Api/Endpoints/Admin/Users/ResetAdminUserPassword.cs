using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Application.Users;
using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Api.Endpoints.Admin.Users;

public sealed class ResetAdminUserPasswordRequest
{
    [RouteParam]
    public Guid Id { get; set; }
}

// Returned EXACTLY ONCE: the new temporary password is never persisted in plaintext.
public sealed record ResetAdminUserPasswordResponse(string TemporaryPassword);

public sealed class ResetAdminUserPasswordRequestValidator
    : Validator<ResetAdminUserPasswordRequest>
{
    public ResetAdminUserPasswordRequestValidator()
    {
        RuleFor(request => request.Id).NotEmpty();
    }
}

// Resets an account to a fresh server-generated temporary password, forces a change on next login,
// and revokes its refresh tokens. Returns the temp password once. Admin-only.
public sealed class ResetAdminUserPassword
    : Endpoint<ResetAdminUserPasswordRequest, ResetAdminUserPasswordResponse>
{
    private readonly IUserService userService;

    public ResetAdminUserPassword(IUserService userService)
    {
        this.userService = userService;
    }

    public override void Configure()
    {
        Post("/api/admin/users/{Id}/reset-password");
        Roles("Admin");
    }

    public override async Task HandleAsync(ResetAdminUserPasswordRequest req, CancellationToken ct)
    {
        var result = await userService.ResetPasswordAsync(req.Id, ct);
        if (!result.IsSuccess)
        {
            await Send.NotFoundAsync(ct);
            return;
        }

        await Send.OkAsync(
            new ResetAdminUserPasswordResponse(result.Value.TemporaryPassword),
            cancellation: ct
        );
    }
}
