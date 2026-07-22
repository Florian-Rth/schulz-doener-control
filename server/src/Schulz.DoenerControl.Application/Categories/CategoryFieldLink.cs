namespace Schulz.DoenerControl.Application.Categories;

// One field exposed on a category, in a given position and with a per-category required flag. Serves
// both directions: it is a row of a CategoryDetails' ordered field list and an item of the
// SetCategoryFieldsCommand that replaces those links. FieldKey references a store FieldDefinition.
public sealed record CategoryFieldLink(string FieldKey, int SortOrder, bool IsRequired);
