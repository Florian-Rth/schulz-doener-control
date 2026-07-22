namespace Schulz.DoenerControl.Core.Enums;

// No longer a persisted column (an item's fields come from its Category). Retained purely as an
// in-memory tier value: TierService derives it from category membership (a category that includes
// the `meat` field is Doener-kind, else Pizza) when projecting TierOrderInput, so the byte-for-byte
// unchanged TierCalculator keeps resolving the Trockenmaus/noSauce and pizza-related tiers exactly.
public enum ProductKind
{
    Doener = 1,
    Pizza = 2,
}
