using Schulz.DoenerControl.Application.Menu;
using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Api.Endpoints.Admin.Menu;

// Endpoint-layer projection of one menu item for the admin management screen, shared by the list,
// create and update responses. Unlike the public MenuItemSummaryDto it carries IsAvailable so the
// admin can see and toggle retired items. Mapped from the Application MenuItemDetails so the service
// type never leaks across the boundary.
public sealed record AdminMenuItemDto(
    string Id,
    string Name,
    int DefaultPriceCents,
    string DefaultPriceLabel,
    string Kind,
    string MaterialIcon,
    string? Note,
    bool IsInsider,
    int SortOrder,
    bool IsAvailable
);

public static class AdminMenuMapper
{
    public static AdminMenuItemDto ToDto(MenuItemDetails details) =>
        new(
            details.Id,
            details.Name,
            details.DefaultPriceCents,
            details.DefaultPriceLabel,
            details.Kind,
            details.MaterialIcon,
            details.Note,
            details.IsInsider,
            details.SortOrder,
            details.IsAvailable
        );

    // The wire token doener/pizza maps to the Core enum. Returns null for anything else so the
    // validator can reject it (the service never sees an unparsable kind).
    public static ProductKind? ParseKind(string? kind) =>
        kind switch
        {
            "doener" => ProductKind.Doener,
            "pizza" => ProductKind.Pizza,
            _ => null,
        };
}
