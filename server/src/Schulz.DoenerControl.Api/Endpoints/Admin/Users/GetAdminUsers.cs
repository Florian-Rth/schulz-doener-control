using FastEndpoints;
using Schulz.DoenerControl.Application.Users;

namespace Schulz.DoenerControl.Api.Endpoints.Admin.Users;

public sealed record GetAdminUsersResponse(IReadOnlyList<AdminUserSummaryDto> Users);

// Lists every account for the admin user-management screen. Admin-only.
public sealed class GetAdminUsers : EndpointWithoutRequest<GetAdminUsersResponse>
{
    private readonly IUserService userService;

    public GetAdminUsers(IUserService userService)
    {
        this.userService = userService;
    }

    public override void Configure()
    {
        Get("/api/admin/users");
        Roles("Admin");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var result = await userService.ListAsync(ct);

        var users = result.Value.Select(AdminUserMapper.ToSummaryDto).ToList();
        await Send.OkAsync(new GetAdminUsersResponse(users), cancellation: ct);
    }
}
