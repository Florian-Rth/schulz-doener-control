using FastEndpoints;
using Schulz.DoenerControl.Application.Menu;

namespace Schulz.DoenerControl.Api.Endpoints.Admin.Menu;

public sealed record GetAdminMenuResponse(IReadOnlyList<AdminMenuItemDto> Items);

// Lists every menu item including retired (unavailable) ones for the admin menu-management screen,
// sorted by SortOrder. Admin-only.
public sealed class GetAdminMenu : EndpointWithoutRequest<GetAdminMenuResponse>
{
    private readonly IMenuService menuService;

    public GetAdminMenu(IMenuService menuService)
    {
        this.menuService = menuService;
    }

    public override void Configure()
    {
        Get("/api/admin/menu");
        Roles("Admin");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var result = await menuService.ListAllAsync(ct);
        var items = result.Value.Select(AdminMenuMapper.ToDto).ToList();
        await Send.OkAsync(new GetAdminMenuResponse(items), cancellation: ct);
    }
}
