using Schulz.DoenerControl.Application.Calculators;
using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Application.Tiers;

public interface ITierService
{
    // Derives the caller's Döner-Tier from their order history over the rolling 90-day window.
    // Always succeeds (an empty history yields the fallback "solider Döner-Bürger").
    Task<Result<DoenerTier>> GetMineAsync(Guid callerId, CancellationToken ct);

    // The full 15-Tier catalogue in priority order, with the caller's own computed tier flagged.
    Task<Result<TierCatalogDetails>> GetCatalogAsync(Guid callerId, CancellationToken ct);

    // The read-only admin view (B4): all 15 tier definitions in priority order with their
    // calculator-derived German trigger conditions, plus the rolling window length they are
    // computed over. No per-user state — purely the static definitions and the window basis.
    Result<TierDefinitionsDetails> GetDefinitions();
}
