using Microsoft.EntityFrameworkCore;
using Schulz.DoenerControl.Application.Calculators;
using Schulz.DoenerControl.Application.Tiers;
using Schulz.DoenerControl.Core;
using Schulz.DoenerControl.Core.Enums;
using Schulz.DoenerControl.Infrastructure.OrderDays;
using Schulz.DoenerControl.Infrastructure.Persistence;

namespace Schulz.DoenerControl.Infrastructure.Tiers;

// Backs the two tier endpoints (PLAN F13). The caller's Döner-Tier is derived live from their Order
// rows over the rolling 90-day window on OccurredOn (nothing aggregate is stored) using the pure
// TierCalculator. The catalogue is the same static 15-entry table with the caller's own tier flagged
// by name. Order instants are projected to memory before the window filter because SQLite cannot
// translate DateTimeOffset comparisons reliably; the per-office data volume makes this trivial.
public sealed class TierService : ITierService
{
    // The rolling tier window (PLAN default): the last 90 days, inclusive, on OccurredOn.
    private const int TierWindowDays = 90;

    private readonly AppDbContext database;
    private readonly OrderDayClock clock;

    public TierService(AppDbContext database, OrderDayClock clock)
    {
        this.database = database;
        this.clock = clock;
    }

    public async Task<Result<DoenerTier>> GetMineAsync(Guid callerId, CancellationToken ct)
    {
        var tier = await ComputeTierAsync(callerId, ct);
        return Result<DoenerTier>.Success(tier);
    }

    public async Task<Result<TierCatalogDetails>> GetCatalogAsync(
        Guid callerId,
        CancellationToken ct
    )
    {
        var mine = await ComputeTierAsync(callerId, ct);

        var entries = TierCalculator
            .Catalog.Select(tier => new TierCatalogEntryDetails(tier, tier.Name == mine.Name))
            .ToList();

        return Result<TierCatalogDetails>.Success(new TierCatalogDetails(entries));
    }

    public Result<TierDefinitionsDetails> GetDefinitions() =>
        Result<TierDefinitionsDetails>.Success(
            new TierDefinitionsDetails(TierCalculator.Catalog, TierWindowDays)
        );

    private async Task<DoenerTier> ComputeTierAsync(Guid callerId, CancellationToken ct)
    {
        // Query the lines directly (joined to their header) rather than SelectMany over the Lines
        // navigation, which SQLite rejects as a LATERAL/APPLY join.
        var lines = await database
            .OrderLines.AsNoTracking()
            .Where(line => line.Order!.UserId == callerId)
            .Select(line => new WindowLine(
                line.Order!.OccurredOn,
                line.ProductId,
                line.Kind,
                line.Meat,
                line.Sauces,
                line.Quantity
            ))
            .ToListAsync(ct);

        var windowStart = clock.Today().AddDays(-(TierWindowDays - 1));

        // A line with Quantity N counts as N of that product (e.g. 2x Pizza = 2 toward Pizza-Verräter),
        // so each in-window line is expanded into Quantity TierOrderInput entries.
        var history = lines
            .Where(line => DateOnly.FromDateTime(line.OccurredOn.UtcDateTime) >= windowStart)
            .SelectMany(line =>
                Enumerable.Repeat(
                    new TierOrderInput(line.ProductId, line.Kind, line.Meat, line.Sauces),
                    line.Quantity
                )
            )
            .ToList();

        return TierCalculator.ComputeTier(history);
    }

    private sealed record WindowLine(
        DateTimeOffset OccurredOn,
        string ProductId,
        ProductKind Kind,
        MeatType? Meat,
        Sauce Sauces,
        int Quantity
    );
}
