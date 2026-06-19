using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Application.Menu;

// Admin create-menu-item input. Id is optional: when omitted the service derives a slug from the
// name so the SPA never has to invent one. Kind is the parsed Core enum — the endpoint translates
// the doener/pizza wire token and rejects anything else before the command is built.
public sealed record CreateMenuItemCommand(
    string? Id,
    string Name,
    int DefaultPriceCents,
    ProductKind Kind,
    string MaterialIcon,
    string? Note,
    bool IsInsider,
    int SortOrder,
    bool IsAvailable
);
