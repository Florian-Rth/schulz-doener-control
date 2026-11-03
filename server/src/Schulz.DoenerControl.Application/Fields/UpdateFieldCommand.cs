namespace Schulz.DoenerControl.Application.Fields;

// Admin update-field input: Key locates the field (Key and Type are both immutable), the rest are the
// editable fields. Display is the lowercase wire token.
public sealed record UpdateFieldCommand(string Key, string Label, string Display, int? MaxLength);
