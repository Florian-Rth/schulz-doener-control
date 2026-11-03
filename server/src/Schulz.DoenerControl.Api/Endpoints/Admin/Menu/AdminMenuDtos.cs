using Schulz.DoenerControl.Api.Endpoints;
using Schulz.DoenerControl.Application.Menu;

namespace Schulz.DoenerControl.Api.Endpoints.Admin.Menu;

// Endpoint-layer projection of one menu item for the admin management screen, shared by the list,
// create and update responses. Unlike the public MenuItemSummaryDto it carries IsAvailable so the
// admin can see and toggle retired items. CategoryKey/BaseItemId/DefaultAnswers replace the old Kind.
// Mapped from the Application MenuItemDetails so the service type never leaks across the boundary.
public sealed record AdminMenuItemDto(
    string Id,
    string Name,
    string? CategoryKey,
    string? BaseItemId,
    int DefaultPriceCents,
    string DefaultPriceLabel,
    string MaterialIcon,
    string? Note,
    bool IsInsider,
    int SortOrder,
    bool IsAvailable,
    IReadOnlyDictionary<string, AnswerFieldDto>? DefaultAnswers
);

public static class AdminMenuMapper
{
    public static AdminMenuItemDto ToDto(MenuItemDetails details) =>
        new(
            details.Id,
            details.Name,
            details.CategoryKey,
            details.BaseItemId,
            details.DefaultPriceCents,
            details.DefaultPriceLabel,
            details.MaterialIcon,
            details.Note,
            details.IsInsider,
            details.SortOrder,
            details.IsAvailable,
            AnswersWire.ToDtoOrNull(details.DefaultAnswers)
        );
}
