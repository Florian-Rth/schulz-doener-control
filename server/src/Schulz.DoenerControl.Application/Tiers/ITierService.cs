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

    // The read-only admin view (B4): all tier definitions in priority order with their
    // calculator-derived German trigger conditions, plus the rolling window length they are
    // computed over. No per-user state — purely the static definitions and the window basis.
    Result<TierDefinitionsDetails> GetDefinitions();

    // The Döner-Tier of each requested user over the rolling 90-day window, with the global Packesel
    // pickup-leader override applied. Used by the leaderboard so every row's tier emoji is derived
    // with the same logic the dashboard tier card uses.
    Task<Result<IReadOnlyDictionary<Guid, DoenerTier>>> GetTiersAsync(
        IReadOnlyCollection<Guid> userIds,
        CancellationToken ct
    );
}
