namespace Schulz.DoenerControl.Application.Categories;

// Replaces the full set of field links on a category in one shot: the service drops every existing
// CategoryField for the category and recreates exactly the given links. Each FieldKey must resolve to
// a FieldDefinition in the active store.
public sealed record SetCategoryFieldsCommand(
    string CategoryKey,
    IReadOnlyList<CategoryFieldLink> Fields
);
