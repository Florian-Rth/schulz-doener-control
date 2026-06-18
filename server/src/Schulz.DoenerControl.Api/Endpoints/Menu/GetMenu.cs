using FastEndpoints;
using Schulz.DoenerControl.Application.Menu;

namespace Schulz.DoenerControl.Api.Endpoints.Menu;

public sealed record MenuItemSummaryDto(
    string Id,
    string Name,
    int DefaultPriceCents,
    string DefaultPriceLabel,
    string Kind,
    string MaterialIcon,
    string? Note,
    bool IsInsider,
    int SortOrder
);

public sealed record GetMenuResponse(
    IReadOnlyList<MenuItemSummaryDto> Items,
    IReadOnlyList<string> PizzaVariants,
    IReadOnlyList<string> SauceOptions,
    IReadOnlyList<string> MeatOptions
);

// The order screen's product grid plus the closed order vocabularies (pizza variants, sauces,
// meats) in a single round-trip. Authenticated.
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
            details.Items.Select(MapItem).ToList(),
            details.PizzaVariants,
            details.SauceOptions,
            details.MeatOptions
        );

    private static MenuItemSummaryDto MapItem(MenuItemSummary item) =>
        new(
            item.Id,
            item.Name,
            item.DefaultPriceCents,
            item.DefaultPriceLabel,
            item.Kind,
            item.MaterialIcon,
            item.Note,
            item.IsInsider,
            item.SortOrder
        );
}
