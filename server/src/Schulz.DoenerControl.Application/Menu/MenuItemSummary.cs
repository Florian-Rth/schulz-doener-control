using Schulz.DoenerControl.Core.Entities;

namespace Schulz.DoenerControl.Application.Menu;

// One item of the order-screen product grid. CategoryKey ties it to the category whose fields the
// form renders; BaseItemKey is set for a preset (the item it prints as); DefaultAnswers pre-seeds the
// form for a preset (still editable). PriceLabel is the German display form of PriceCents.
public sealed record MenuItemSummary(
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
    LineAnswers? DefaultAnswers
);
