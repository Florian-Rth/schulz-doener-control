namespace Schulz.DoenerControl.Application.Tiers;

// The full 15-entry Döner-Tier catalogue in priority order, with the caller's own tier flagged.
public sealed record TierCatalogDetails(IReadOnlyList<TierCatalogEntryDetails> Entries);
