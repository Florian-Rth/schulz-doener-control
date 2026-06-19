using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Application.Menu;

// Admin update-menu-item input. Id targets an existing row (the id itself is immutable — it is the
// FK past orders froze onto). Kind is the parsed Core enum; the endpoint translates the wire token.
public sealed record UpdateMenuItemCommand(
    string Id,
    string Name,
    int DefaultPriceCents,
    ProductKind Kind,
    string MaterialIcon,
    string? Note,
    bool IsInsider,
    int SortOrder,
    bool IsAvailable
);
