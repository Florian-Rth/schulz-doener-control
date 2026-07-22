namespace Schulz.DoenerControl.Application.Fields;

// Admin create-field input, scoped to the active store. Type/Display are the lowercase wire tokens
// the service maps to the FieldType/FieldDisplay enums. Key is the immutable identity; a duplicate is
// a conflict. Options are added afterwards via the option endpoints.
public sealed record CreateFieldCommand(
    string Key,
    string Label,
    string Type,
    string Display,
    int? MaxLength
);
