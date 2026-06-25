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
// TierCalculator, then the global 🐎 Packesel superlative is layered on top: a user who is the top
// pickup person across all users over the same window wears the Packesel regardless of their order
// pattern. ComputeTiersAsync does the same for a batch of users so the leaderboard derives each
// row's tier emoji with identical logic (the dashboard tier card and the leaderboard agree). The
// catalogue is the same static table with the caller's own tier flagged by name. Order instants are
// projected to memory before the window filter because SQLite cannot translate DateTimeOffset
// comparisons reliably; the per-office data volume makes this trivial.
public sealed class TierService : ITierService
{
    // The rolling tier window (PLAN default): the last 90 days, inclusive, on OccurredOn.
    private const int TierWindowDays = 90;

    // A user with no in-window orders resolves to the fallback pattern tier (empty history).
    private static readonly DoenerTier EmptyPatternTier = TierCalculator.ComputeTier([]);

    private readonly AppDbContext database;
    private readonly OrderDayClock clock;

    public TierService(AppDbContext database, OrderDayClock clock)
    {
        this.database = database;
        this.clock = clock;
    }

    public async Task<Result<DoenerTier>> GetMineAsync(Guid callerId, CancellationToken ct)
    {
        var tiers = await ComputeTiersAsync([callerId], ct);
        return Result<DoenerTier>.Success(tiers[callerId]);
    }

    public async Task<Result<TierCatalogDetails>> GetCatalogAsync(
        Guid callerId,
        CancellationToken ct
    )
    {
        var tiers = await ComputeTiersAsync([callerId], ct);
        var mine = tiers[callerId];

        var entries = TierCalculator
            .Catalog.Select(tier => new TierCatalogEntryDetails(tier, tier.Name == mine.Name))
            .ToList();

        return Result<TierCatalogDetails>.Success(new TierCatalogDetails(entries));
    }

    public Result<TierDefinitionsDetails> GetDefinitions() =>
        Result<TierDefinitionsDetails>.Success(
            new TierDefinitionsDetails(TierCalculator.Catalog, TierWindowDays)
        );

    public async Task<Result<IReadOnlyDictionary<Guid, DoenerTier>>> GetTiersAsync(
        IReadOnlyCollection<Guid> userIds,
        CancellationToken ct
    )
    {
        var tiers = await ComputeTiersAsync(userIds, ct);
        return Result<IReadOnlyDictionary<Guid, DoenerTier>>.Success(tiers);
    }

    // Computes each requested user's tier over the rolling window: their order-pattern tier with the
    // global Packesel override applied on top. The Packesel winner(s) are resolved across ALL users'
    // pickups (not only the requested set) so the superlative is genuinely global; the override then
    // only fires for requested users who win. Empty input short-circuits.
    private async Task<IReadOnlyDictionary<Guid, DoenerTier>> ComputeTiersAsync(
        IReadOnlyCollection<Guid> userIds,
        CancellationToken ct
    )
    {
        if (userIds.Count == 0)
            return new Dictionary<Guid, DoenerTier>();

        var windowStart = clock.Today().AddDays(-(TierWindowDays - 1));

        var patternTiers = await PatternTiersAsync(userIds, windowStart, ct);
        var pickupLeaders = await PickupLeadersAsync(windowStart, ct);

        var result = new Dictionary<Guid, DoenerTier>(userIds.Count);
        foreach (var userId in userIds.Distinct())
        {
            var patternTier = patternTiers.GetValueOrDefault(userId, EmptyPatternTier);

            // The Packesel carries the pattern tier's Count so the dashboard still shows how many
            // orders the window held for the winner.
            result[userId] = pickupLeaders.Contains(userId)
                ? TierCalculator.Packesel with
                {
                    Count = patternTier.Count,
                }
                : patternTier;
        }

        return result;
    }

    // Per-user order-pattern tiers over the window, for the requested users only. The lines are
    // queried directly (joined to their header) rather than via SelectMany over the Lines navigation,
    // which SQLite rejects as a LATERAL/APPLY join, then grouped per user in memory.
    private async Task<Dictionary<Guid, DoenerTier>> PatternTiersAsync(
        IReadOnlyCollection<Guid> userIds,
        DateOnly windowStart,
        CancellationToken ct
    )
    {
        var ids = userIds.ToHashSet();

        var lines = await database
            .OrderLines.AsNoTracking()
            .Where(line => ids.Contains(line.Order!.UserId))
            .Select(line => new WindowLine(
                line.Order!.UserId,
                line.Order!.OccurredOn,
                line.ProductId,
                line.Kind,
                line.Meat,
                line.Sauces,
                line.Quantity
            ))
            .ToListAsync(ct);

        // A line with Quantity N counts as N of that product (e.g. 2x Pizza = 2 toward Pizza-Verräter),
        // so each in-window line is expanded into Quantity TierOrderInput entries before grouping.
        return lines
            .Where(line => DateOnly.FromDateTime(line.OccurredOn.UtcDateTime) >= windowStart)
            .GroupBy(line => line.UserId)
            .ToDictionary(
                group => group.Key,
                group =>
                    TierCalculator.ComputeTier(
                        group
                            .SelectMany(line =>
                                Enumerable.Repeat(
                                    new TierOrderInput(
                                        line.ProductId,
                                        line.Kind,
                                        line.Meat,
                                        line.Sauces
                                    ),
                                    line.Quantity
                                )
                            )
                            .ToList()
                    )
            );
    }

    // The Packesel winner(s): the user(s) with the most pickups over the window (min 2, ties share).
    private async Task<IReadOnlyCollection<Guid>> PickupLeadersAsync(
        DateOnly windowStart,
        CancellationToken ct
    )
    {
        var pickupCounts = await PickupCountsAsync(windowStart, ct);
        return PickupLeaderCalculator.WinningUserIds(pickupCounts);
    }

    // Per-user pickup tallies over the rolling window across all users (each pickup order counts
    // once, irrespective of its lines). Order instants are projected to memory before the window
    // filter because SQLite cannot translate DateTimeOffset comparisons reliably.
    private async Task<Dictionary<Guid, int>> PickupCountsAsync(
        DateOnly windowStart,
        CancellationToken ct
    )
    {
        var pickups = await database
            .Orders.AsNoTracking()
            .Where(order => order.IsPickup)
            .Select(order => new PickupOrder(order.UserId, order.OccurredOn))
            .ToListAsync(ct);

        return pickups
            .Where(order => DateOnly.FromDateTime(order.OccurredOn.UtcDateTime) >= windowStart)
            .GroupBy(order => order.UserId)
            .ToDictionary(group => group.Key, group => group.Count());
    }

    private sealed record WindowLine(
        Guid UserId,
        DateTimeOffset OccurredOn,
        string ProductId,
        ProductKind Kind,
        MeatType? Meat,
        Sauce Sauces,
        int Quantity
    );

    private sealed record PickupOrder(Guid UserId, DateTimeOffset OccurredOn);
}
