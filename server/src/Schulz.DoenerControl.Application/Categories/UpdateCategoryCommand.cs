namespace Schulz.DoenerControl.Application.Categories;

// Admin update-category input: Key locates the category (it is immutable), the rest are the editable
// fields.
public sealed record UpdateCategoryCommand(
    string Key,
    string Name,
    int SortOrder,
    bool IsAvailable
);
