using Schulz.DoenerControl.Core.Entities;

namespace Schulz.DoenerControl.Application.Menu;

// Admin update-menu-item input. Id targets an existing row (the id itself is immutable — it is the
// FK past orders froze onto). CategoryKey/BaseItemId/DefaultAnswers replace the old Kind enum.
public sealed record UpdateMenuItemCommand(
    string Id,
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
