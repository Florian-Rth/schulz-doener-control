namespace Schulz.DoenerControl.Core.Entities;

// The join that exposes a library FieldDefinition on a Category, in a given position and with a
// per-category required flag (the same field can be optional on one category and required on
// another). Unique on (CategoryId, FieldDefinitionId) so a field is listed at most once per category.
public sealed class CategoryField
{
    public Guid Id { get; set; }

    public Guid CategoryId { get; set; }

    public Guid FieldDefinitionId { get; set; }

    public int SortOrder { get; set; }

    public bool IsRequired { get; set; }

    public Category? Category { get; set; }

    public FieldDefinition? FieldDefinition { get; set; }
}
