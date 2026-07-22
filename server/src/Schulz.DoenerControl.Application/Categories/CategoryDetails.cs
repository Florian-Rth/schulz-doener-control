namespace Schulz.DoenerControl.Application.Categories;

// The admin view of a single food category within the active store, including its ordered field
// links. Key is the immutable seed identity; Name/SortOrder/IsAvailable are editable. Used for both
// the admin list and the single-category mutation responses.
public sealed record CategoryDetails(
    string Key,
    string Name,
    int SortOrder,
    bool IsAvailable,
    IReadOnlyList<CategoryFieldLink> Fields
);
