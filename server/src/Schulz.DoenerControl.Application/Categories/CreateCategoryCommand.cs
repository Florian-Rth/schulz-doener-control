namespace Schulz.DoenerControl.Application.Categories;

// Admin create-category input, scoped to the active store. Key is the stable identity a duplicate of
// which is a conflict; it is immutable once created.
public sealed record CreateCategoryCommand(
    string Key,
    string Name,
    int SortOrder,
    bool IsAvailable
);
