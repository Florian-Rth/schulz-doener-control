namespace Schulz.DoenerControl.Application.Fields;

// The admin view of one option of a select field. Unlike the public MenuOptionDetails it carries
// SortOrder and IsAvailable so the admin can reorder and retire options. Key is the immutable seed
// identity; the reserved meat/sauce option keys can never be deleted (Tier contract).
public sealed record FieldOptionDetails(
    string Key,
    string Label,
    string? Icon,
    int PriceDeltaCents,
    int SortOrder,
    bool IsAvailable
);
