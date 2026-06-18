using Microsoft.EntityFrameworkCore;
using Schulz.DoenerControl.Application.Calculators;
using Schulz.DoenerControl.Application.Dashboard;
using Schulz.DoenerControl.Application.Debts;
using Schulz.DoenerControl.Core;
using Schulz.DoenerControl.Core.Enums;
using Schulz.DoenerControl.Infrastructure.OrderDays;
using Schulz.DoenerControl.Infrastructure.Persistence;

namespace Schulz.DoenerControl.Infrastructure.Dashboard;

// Composes the home-screen aggregate. Everything except the open debts is derived live from the
// Order rows (nothing aggregate is stored): lifetime count, this-month spend, the streak and the
// tier read the caller's own orders; the leaderboard groups every active user's current-year
// orders. The open debts are reused from the existing debt service. Order instants are projected
// to memory before any month/year/window filtering because SQLite cannot translate DateTimeOffset
// comparisons reliably — the per-office data volume makes this trivial.
public sealed class DashboardService : IDashboardService
{
    // The rolling tier window (PLAN default): the last 90 days, inclusive, on OccurredOn.
    private static readonly int TierWindowDays = 90;

    private readonly AppDbContext database;
    private readonly IDebtService debtService;
    private readonly OrderDayClock clock;

    public DashboardService(AppDbContext database, IDebtService debtService, OrderDayClock clock)
    {
        this.database = database;
        this.debtService = debtService;
        this.clock = clock;
    }

    public async Task<Result<DashboardDetails>> GetAsync(Guid callerId, CancellationToken ct)
    {
        var openDebtsResult = await debtService.GetOpenForDebtorAsync(callerId, ct);
        if (!openDebtsResult.IsSuccess)
            return Result<DashboardDetails>.Validation(openDebtsResult.Errors.ToArray());
        var openDebts = openDebtsResult.Value;

        var today = clock.Today();
        var callerOrders = await LoadCallerOrders(callerId, ct);

        var stats = BuildStats(callerOrders, openDebts, today);
        var tier = BuildTier(callerOrders, today);
        var leaderboard = await BuildLeaderboard(callerId, today.Year, ct);

        return Result<DashboardDetails>.Success(
            new DashboardDetails(stats, tier, leaderboard, openDebts)
        );
    }

    private async Task<IReadOnlyList<CallerOrder>> LoadCallerOrders(
        Guid callerId,
        CancellationToken ct
    ) =>
        await database
            .Orders.AsNoTracking()
            .Where(order => order.UserId == callerId)
            .Select(order => new CallerOrder(
                order.OccurredOn,
                order.PriceCents,
                order.ProductId,
                order.Kind,
                order.Meat,
                order.Sauces
            ))
            .ToListAsync(ct);

    private static DashboardStatsDetails BuildStats(
        IReadOnlyList<CallerOrder> orders,
        DebtLedgerDetails openDebts,
        DateOnly today
    )
    {
        var lifetimeCount = orders.Count;

        var monthlyCents = orders
            .Where(order =>
                order.OccurredOn.Year == today.Year && order.OccurredOn.Month == today.Month
            )
            .Sum(order => order.PriceCents);

        var streak = StreakCalculator.ComputeStreak(
            orders.Select(order => DateOnly.FromDateTime(order.OccurredOn.UtcDateTime)).ToList(),
            today
        );

        return new DashboardStatsDetails(
            lifetimeCount,
            monthlyCents,
            MoneyFormatter.ToGermanString(monthlyCents),
            openDebts.OpenCount,
            openDebts.TotalCents,
            openDebts.TotalLabel,
            streak
        );
    }

    private static DoenerTier BuildTier(IReadOnlyList<CallerOrder> orders, DateOnly today)
    {
        var windowStart = today.AddDays(-(TierWindowDays - 1));
        var history = orders
            .Where(order => DateOnly.FromDateTime(order.OccurredOn.UtcDateTime) >= windowStart)
            .Select(order => new TierOrderInput(
                order.ProductId,
                order.Kind,
                order.Meat,
                order.Sauces
            ))
            .ToList();

        return TierCalculator.ComputeTier(history);
    }

    private async Task<Leaderboard> BuildLeaderboard(Guid callerId, int year, CancellationToken ct)
    {
        // Pull every active user's year-tagged orders to memory, then group: SQLite cannot do the
        // year filter on the DateTimeOffset, and the office-scale volume makes the projection cheap.
        var yearOrders = await database
            .Orders.AsNoTracking()
            .Where(order => order.User != null && order.User.IsActive)
            .Select(order => new YearOrder(order.UserId, order.User!.DisplayName, order.OccurredOn))
            .ToListAsync(ct);

        var entries = yearOrders
            .Where(order => order.OccurredOn.Year == year)
            .GroupBy(order => (order.UserId, order.DisplayName))
            .Select(group => new LeaderboardEntryInput(
                group.Key.UserId,
                group.Key.DisplayName,
                group.Count()
            ))
            .ToList();

        return LeaderboardCalculator.Rank(entries, callerId);
    }

    private sealed record CallerOrder(
        DateTimeOffset OccurredOn,
        int PriceCents,
        string ProductId,
        ProductKind Kind,
        MeatType? Meat,
        Sauce Sauces
    );

    private sealed record YearOrder(Guid UserId, string DisplayName, DateTimeOffset OccurredOn);
}
