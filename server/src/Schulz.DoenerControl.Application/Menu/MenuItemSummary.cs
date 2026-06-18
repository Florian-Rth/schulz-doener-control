namespace Schulz.DoenerControl.Application.Menu;

// One row of the order-screen product grid. Kind is the lowercase string id the SPA branches on
// (doener/pizza); DefaultPriceLabel is the German display form derived from DefaultPriceCents.
public sealed record MenuItemSummary(
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
