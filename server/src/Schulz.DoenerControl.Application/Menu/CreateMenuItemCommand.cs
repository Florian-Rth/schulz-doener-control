using Schulz.DoenerControl.Core.Entities;

namespace Schulz.DoenerControl.Application.Menu;

// Admin create-menu-item input. Id is optional: when omitted the service derives a slug from the
// name so the SPA never has to invent one. CategoryKey assigns the item to a category within the
// active store (null = unassigned); BaseItemId makes it a preset; DefaultAnswers pre-seeds a preset.
public sealed record CreateMenuItemCommand(
    string? Id,
    string Name,
    string? CategoryKey,
    string? BaseItemId,
    int DefaultPriceCents,
    string MaterialIcon,
    string? Note,
    bool IsInsider,
    int SortOrder,
    bool IsAvailable,
    LineAnswers? DefaultAnswers
);
