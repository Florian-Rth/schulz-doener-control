using Schulz.DoenerControl.Core.Entities;

namespace Schulz.DoenerControl.Application.Menu;

// The full admin view of a single menu item, including IsAvailable (which the public order-form
// projection MenuItemSummary deliberately omits). CategoryKey/BaseItemId/DefaultAnswers replace the
// old Kind enum: an item's fields come from its category, and a preset points at its base item.
public sealed record MenuItemDetails(
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
    LineAnswers? DefaultAnswers
);
