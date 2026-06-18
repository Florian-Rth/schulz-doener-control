using Microsoft.EntityFrameworkCore;
using Schulz.DoenerControl.Application.Calculators;
using Schulz.DoenerControl.Application.Leaderboards;
using Schulz.DoenerControl.Core;
using Schulz.DoenerControl.Infrastructure.Persistence;

namespace Schulz.DoenerControl.Infrastructure.Leaderboards;

// Derives the per-year Döner-Bestenliste live from the Order rows (nothing aggregate is stored):
// every active user's year-tagged orders are pulled to memory, grouped into per-user tallies, ranked
// by the pure LeaderboardCalculator, then enriched with each user's stored avatar colour. Order
// instants are projected before the year filter because SQLite cannot translate DateTimeOffset
// comparisons reliably; the per-office data volume makes the in-memory pass trivial.
public sealed class LeaderboardService : ILeaderboardService
{
    private readonly AppDbContext database;

    public LeaderboardService(AppDbContext database)
    {
        this.database = database;
    }

    public async Task<Result<LeaderboardDetails>> GetForYearAsync(
        GetLeaderboardQuery query,
        CancellationToken ct
    )
    {
        var yearOrders = await database
            .Orders.AsNoTracking()
            .Where(order => order.User != null && order.User.IsActive)
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

        var detailEntries = board
            .Rows.Select(row => new LeaderboardEntryDetails(
                row.Rank,
                row.UserId,
                row.DisplayName,
                row.Initials,
                avatarColours.GetValueOrDefault(row.UserId, string.Empty),
                row.Count,
                row.IsCurrentUser
            ))
            .ToList();

        return Result<LeaderboardDetails>.Success(
            new LeaderboardDetails(query.Year, detailEntries, board.NextRankDiff, board.NextRank)
        );
    }

    private sealed record YearOrder(
        Guid UserId,
        string DisplayName,
        string AvatarColorHex,
        DateTimeOffset OccurredOn
    );
}
