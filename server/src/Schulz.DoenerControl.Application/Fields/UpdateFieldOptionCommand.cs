namespace Schulz.DoenerControl.Application.Fields;

// Admin update-option input: FieldKey + OptionKey locate the option (both immutable), the rest are
// the editable fields. A reserved meat/sauce option can be relabelled/repriced/retired here, only its
// key and its existence are protected.
public sealed record UpdateFieldOptionCommand(
    string FieldKey,
    string OptionKey,
    string Label,
    string? Icon,
    int PriceDeltaCents,
    int SortOrder,
    bool IsAvailable
);
