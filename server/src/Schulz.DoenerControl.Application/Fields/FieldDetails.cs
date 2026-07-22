namespace Schulz.DoenerControl.Application.Fields;

// The admin view of a single field definition within the active store, including all its options
// (available and retired). Type/Display are the lowercase wire tokens (single/multi/text,
// segmented/chips/dropdown/textarea). Key + Type are immutable once created; the reserved meat/sauce
// field keys can never be deleted (Tier contract). MaxLength applies to text fields only.
public sealed record FieldDetails(
    string Key,
    string Label,
    string Type,
    string Display,
    int? MaxLength,
    IReadOnlyList<FieldOptionDetails> Options
);
