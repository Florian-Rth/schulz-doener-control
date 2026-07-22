namespace Schulz.DoenerControl.Application.Fields;

// Admin add-option input: FieldKey locates the owning field, Key is the new option's immutable
// identity (a duplicate within the field is a conflict). PriceDeltaCents is added to the line price
// when the option is chosen.
public sealed record AddFieldOptionCommand(
    string FieldKey,
    string Key,
    string Label,
    string? Icon,
    int PriceDeltaCents,
    int SortOrder,
    bool IsAvailable
);
