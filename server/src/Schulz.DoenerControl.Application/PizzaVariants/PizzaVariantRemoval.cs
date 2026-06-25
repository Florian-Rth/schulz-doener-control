namespace Schulz.DoenerControl.Application.PizzaVariants;

// The outcome of removing a pizza variant: a variant referenced by any (past) order line cannot be
// hard-deleted without orphaning the FK, so it is soft-retired (IsAvailable=false) instead. An
// unreferenced variant is hard-deleted. Both are a 204 to the caller; this just records which one.
public enum PizzaVariantRemoval
{
    Deleted,
    Retired,
}
