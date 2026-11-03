using FastEndpoints;
using Schulz.DoenerControl.Application.Menu;

namespace Schulz.DoenerControl.Api.Endpoints.Menu;

public sealed record MenuOptionDto(string Key, string Label, string? Icon, int PriceDeltaCents);

public sealed record MenuFieldDto(
    string Key,
    string Label,
    string Type,
    string Display,
    int? MaxLength,
    bool Required,
    IReadOnlyList<MenuOptionDto> Options
);

public sealed record MenuCategoryDto(
    string Key,
    string Name,
    int SortOrder,
    IReadOnlyList<MenuFieldDto> Fields
);

public sealed record MenuItemSummaryDto(
    string Id,
    string Name,
    string? CategoryKey,
    string? BaseItemKey,
    int PriceCents,
    string PriceLabel,
    string MaterialIcon,
    string? Note,
    bool IsInsider,
    int SortOrder,
    IReadOnlyDictionary<string, AnswerFieldDto>? DefaultAnswers
);

public sealed record GetMenuResponse(
    IReadOnlyList<MenuCategoryDto> Categories,
    IReadOnlyList<MenuItemSummaryDto> Items
);

// The order screen's food categories (with their generic fields → options) plus the available menu
// items, scoped to the single active store, in a single round-trip. Authenticated.
public sealed class GetMenu : EndpointWithoutRequest<GetMenuResponse>
{
    private readonly IMenuService menuService;

    public GetMenu(IMenuService menuService)
    {
        this.menuService = menuService;
    }

    public override void Configure()
    {
        Get("/api/menu");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var result = await menuService.GetMenuAsync(ct);
        if (!result.IsSuccess)
        {
            await Send.ErrorsAsync(cancellation: ct);
            return;
        }

        await Send.OkAsync(MapToResponse(result.Value), cancellation: ct);
    }

    private static GetMenuResponse MapToResponse(MenuDetails details) =>
        new(
            details.Categories.Select(MapCategory).ToList(),
            details.Items.Select(MapItem).ToList()
        );

    private static MenuCategoryDto MapCategory(MenuCategoryDetails category) =>
        new(
            category.Key,
            category.Name,
            category.SortOrder,
            category.Fields.Select(MapField).ToList()
        );

    private static MenuFieldDto MapField(MenuFieldDetails field) =>
        new(
            field.Key,
            field.Label,
            field.Type,
            field.Display,
            field.MaxLength,
            field.Required,
            field
                .Options.Select(option => new MenuOptionDto(
                    option.Key,
                    option.Label,
                    option.Icon,
                    option.PriceDeltaCents
                ))
                .ToList()
        );

    private static MenuItemSummaryDto MapItem(MenuItemSummary item) =>
        new(
            item.Id,
            item.Name,
            item.CategoryKey,
            item.BaseItemKey,
            item.PriceCents,
            item.PriceLabel,
            item.MaterialIcon,
            item.Note,
            item.IsInsider,
            item.SortOrder,
            AnswersWire.ToDtoOrNull(item.DefaultAnswers)
        );
}
