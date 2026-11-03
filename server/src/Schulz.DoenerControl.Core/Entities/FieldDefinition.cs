using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Core.Entities;

// The reusable field library, per store: one definition per answerable question (Fleisch, Soße,
// Beilage, Sorte, Extrawünsche), referenced by any number of categories via CategoryField rather
// than duplicated. Type drives validation, Display drives rendering. Key is the stable seed identity,
// unique per store; the reserved keys `meat`/`sauce` are immutable (the Tier contract depends on
// them). MaxLength applies to Text fields only.
public sealed class FieldDefinition
{
    public Guid Id { get; set; }

    public Guid StoreId { get; set; }

    public required string Key { get; set; }

    public required string Label { get; set; }

    public FieldType Type { get; set; }

    public FieldDisplay Display { get; set; }

    public int? MaxLength { get; set; }

    public Store? Store { get; set; }

    public ICollection<FieldOption>? Options { get; set; }
}
