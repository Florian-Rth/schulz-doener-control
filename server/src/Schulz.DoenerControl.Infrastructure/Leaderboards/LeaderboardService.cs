using Microsoft.EntityFrameworkCore;
using Schulz.DoenerControl.Application.Calculators;
using Schulz.DoenerControl.Application.Leaderboards;
using Schulz.DoenerControl.Application.Tiers;
using Schulz.DoenerControl.Core;
using Schulz.DoenerControl.Infrastructure.Orders;
using Schulz.DoenerControl.Infrastructure.Persistence;

namespace Schulz.DoenerControl.Infrastructure.Leaderboards;

// Derives the per-year Döner-Bestenliste live from the Order rows (nothing aggregate is stored):
// every active user's year-tagged orders that COUNT (fail-safe: day closed and, for non-pickup
// orders, the debt settled — see StatsOrderFilter) are pulled to memory, grouped into per-user tallies, ranked
// by the pure LeaderboardCalculator, then enriched with each user's stored avatar colour and their
// Döner-Tier emoji over the rolling 90-day window (the TierService applies the same pattern + global
// Packesel logic the dashboard tier card uses, so the two always agree). Order instants are projected
// before the year filter because SQLite cannot translate DateTimeOffset comparisons reliably; the
// per-office data volume makes the in-memory pass trivial.
public sealed class LeaderboardService : ILeaderboardService
{
    private readonly AppDbContext database;
    private readonly ITierService tierService;

    public LeaderboardService(AppDbContext database, ITierService tierService)
    {
        this.database = database;
        this.tierService = tierService;
    }

    public async Task<Result<LeaderboardDetails>> GetForYearAsync(
        GetLeaderboardQuery query,
        CancellationToken ct
    )
    {
        var yearOrders = await database
            .Orders.AsNoTracking()
            .Where(order => order.User != null && order.User.IsActive)
            .CountingTowardStats(database)
            .Select(order => new YearOrder(
                order.UserId,
                order.User!.DisplayName,
                order.User!.AvatarColorHex,
                order.OccurredOn
            ))
            .ToListAsync(ct);

        var inYear = yearOrders.Where(order => order.OccurredOn.Year == query.Year).ToList();

        var avatarColours = inYear
            .GroupBy(order => order.UserId)
            .ToDictionary(group => group.Key, group => group.First().AvatarColorHex);

        var entries = inYear
            .GroupBy(order => (order.UserId, order.DisplayName))
            .Select(group => new LeaderboardEntryInput(
                group.Key.UserId,
                group.Key.DisplayName,
                group.Count()
            ))
            .ToList();

        var board = LeaderboardCalculator.Rank(entries, query.CallerUserId);

        var tierEmojis = await TierEmojisAsync(board.Rows.Select(row => row.UserId).ToList(), ct);

        var detailEntries = board
            .Rows.Select(row => new LeaderboardEntryDetails(
                row.Rank,
                row.UserId,
                row.DisplayName,
                row.Initials,
                avatarColours.GetValueOrDefault(row.UserId, string.Empty),
                row.Count,
                row.IsCurrentUser,
                tierEmojis.GetValueOrDefault(row.UserId)
            ))
            .ToList();

        return Result<LeaderboardDetails>.Success(
            new LeaderboardDetails(query.Year, detailEntries, board.NextRankDiff, board.NextRank)
        );
    }

    private async Task<IReadOnlyDictionary<Guid, string>> TierEmojisAsync(
        IReadOnlyCollection<Guid> userIds,
        CancellationToken ct
    )
    {
        if (userIds.Count == 0)
            return new Dictionary<Guid, string>();

        var tiersResult = await tierService.GetTiersAsync(userIds, ct);
        if (!tiersResult.IsSuccess)
            return new Dictionary<Guid, string>();

        return tiersResult.Value.ToDictionary(pair => pair.Key, pair => pair.Value.Emoji);
    }

    private sealed record YearOrder(
        Guid UserId,
        string DisplayName,
        string AvatarColorHex,
        DateTimeOffset OccurredOn
    );
}
