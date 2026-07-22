namespace Schulz.DoenerControl.Core.Enums;

// A rendering hint the order form maps onto a concrete control, so the generic renderer keeps the
// bespoke segmented/chips UX: Segmented and Dropdown drive single-select, Chips drives multi-select,
// Textarea drives free text.
public enum FieldDisplay
{
    Segmented = 1,
    Chips = 2,
    Dropdown = 3,
    Textarea = 4,
}
