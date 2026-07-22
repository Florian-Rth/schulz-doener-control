namespace Schulz.DoenerControl.Core.Enums;

// The kind of answer a FieldDefinition collects. Deliberately minimal for v1 (no number/toggle until
// a real need): a single choice, several choices, or free text.
public enum FieldType
{
    SingleSelect = 1,
    MultiSelect = 2,
    Text = 3,
}
