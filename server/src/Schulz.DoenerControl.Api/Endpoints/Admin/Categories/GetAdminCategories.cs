using FastEndpoints;
using Schulz.DoenerControl.Application.Categories;

namespace Schulz.DoenerControl.Api.Endpoints.Admin.Categories;

public sealed record GetAdminCategoriesResponse(IReadOnlyList<AdminCategorySummaryDto> Items);

// Lists every food category of the active store (available and hidden) with its ordered field links,
// sorted by SortOrder, for the admin menu-management screen. Admin-only.
public sealed class GetAdminCategories : EndpointWithoutRequest<GetAdminCategoriesResponse>
{
    private readonly ICategoryService categoryService;

    public GetAdminCategories(ICategoryService categoryService)
    {
        this.categoryService = categoryService;
    }

    public override void Configure()
    {
        Get("/api/admin/categories");
        Roles("Admin");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var result = await categoryService.ListAllAsync(ct);
        var items = result.Value.Select(AdminCategoryMapper.ToDto).ToList();
        await Send.OkAsync(new GetAdminCategoriesResponse(items), cancellation: ct);
    }
}
