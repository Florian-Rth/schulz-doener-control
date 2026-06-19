namespace Schulz.DoenerControl.Application.Menu;

// The full admin view of a single menu item, including IsAvailable (which the public order-form
// projection MenuItemSummary deliberately omits). Kind is the lowercase string token the SPA
// branches on (doener/pizza), mirroring MenuItemSummary.
public sealed record MenuItemDetails(
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
