using Schulz.DoenerControl.Application.Calculators;

namespace Schulz.DoenerControl.Application.Tiers;

// One catalogue row: a Döner-Tier plus whether it is the caller's own computed tier. IsMine is set
// for exactly one entry — the one whose name matches the caller's currently-derived tier.
public sealed record TierCatalogEntryDetails(DoenerTier Tier, bool IsMine);
