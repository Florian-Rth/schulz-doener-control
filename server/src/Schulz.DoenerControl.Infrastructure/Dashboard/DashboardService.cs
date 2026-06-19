using Microsoft.EntityFrameworkCore;
using Schulz.DoenerControl.Application.Calculators;
using Schulz.DoenerControl.Application.Dashboard;
using Schulz.DoenerControl.Application.Debts;
using Schulz.DoenerControl.Application.Leaderboards;
using Schulz.DoenerControl.Application.OrderDays;
using Schulz.DoenerControl.Application.Tiers;
using Schulz.DoenerControl.Application.Users;
using Schulz.DoenerControl.Core;
using Schulz.DoenerControl.Infrastructure.OrderDays;
using Schulz.DoenerControl.Infrastructure.Persistence;

namespace Schulz.DoenerControl.Infrastructure.Dashboard;

// Composes the home-screen aggregate (PLAN #8) by reusing the granular services so each figure stays
// single-sourced: the caller identity (greeting + avatar), the caller's Döner-Tier, the current-year
// leaderboard, today's Döner-Tag and the caller's open debts. Only the four stat tiles are derived
// here, live from the caller's own Order rows (nothing aggregate is stored). The caller orders are
// projected to memory before any month filtering because SQLite cannot translate DateTimeOffset
// comparisons reliably — the per-office data volume makes that trivial.
public sealed class DashboardService : IDashboardService
{
    private readonly AppDbContext database;
    private readonly IUserService userService;
    private readonly ITierService tierService;
    private readonly ILeaderboardService leaderboardService;
    private readonly IOrderDayService orderDayService;
    private readonly IDebtService debtService;
    private readonly OrderDayClock clock;

    public DashboardService(
        AppDbContext database,
        IUserService userService,
        ITierService tierService,
        ILeaderboardService leaderboardService,
        IOrderDayService orderDayService,
        IDebtService debtService,
        OrderDayClock clock
    )
    {
        this.database = database;
        this.userService = userService;
        this.tierService = tierService;
        this.leaderboardService = leaderboardService;
        this.orderDayService = orderDayService;
        this.debtService = debtService;
        this.clock = clock;
    }

    public async Task<Result<DashboardDetails>> GetAsync(Guid callerId, CancellationToken ct)
    {
        var callerResult = await userService.GetMeAsync(callerId, ct);
        if (!callerResult.IsSuccess)
            return Result<DashboardDetails>.NotFound();

        var openDebtsResult = await debtService.GetOpenForDebtorAsync(callerId, ct);
        if (!openDebtsResult.IsSuccess)
            return Result<DashboardDetails>.Validation(openDebtsResult.Errors.ToArray());

        var tierResult = await tierService.GetMineAsync(callerId, ct);
        if (!tierResult.IsSuccess)
            return Result<DashboardDetails>.Validation(tierResult.Errors.ToArray());

        var today = clock.Today();
        var leaderboardResult = await leaderboardService.GetForYearAsync(
            new GetLeaderboardQuery(today.Year, callerId),
            ct
        );
        if (!leaderboardResult.IsSuccess)
            return Result<DashboardDetails>.Validation(leaderboardResult.Errors.ToArray());

        var todayResult = await orderDayService.GetTodayAsync(callerId, ct);
        if (!todayResult.IsSuccess)
            return Result<DashboardDetails>.Validation(todayResult.Errors.ToArray());

        var openDebts = openDebtsResult.Value;
        var stats = await BuildStats(callerId, openDebts, today, ct);

        return Result<DashboardDetails>.Success(
            new DashboardDetails(
                callerResult.Value,
                stats,
                tierResult.Value,
                leaderboardResult.Value,
                todayResult.Value,
                openDebts,
                Toast: null
            )
        );
    }

    private async Task<DashboardStatsDetails> BuildStats(
        Guid callerId,
        DebtLedgerDetails openDebts,
        DateOnly today,
        CancellationToken ct
    )
    {
        var callerOrders = await database
            .Orders.AsNoTracking()
            .Where(order => order.UserId == callerId)
            .Select(order => new CallerOrder(
                order.OccurredOn,
                order.Lines.Sum(line => line.Quantity * line.PriceCents)
            ))
            .ToListAsync(ct);

        var lifetimeCount = callerOrders.Count;

        var monthlyCents = callerOrders
            .Where(order =>
                order.OccurredOn.Year == today.Year && order.OccurredOn.Month == today.Month
            )
            .Sum(order => order.PriceCents);

        var streak = StreakCalculator.ComputeStreak(
            callerOrders
                .Select(order => DateOnly.FromDateTime(order.OccurredOn.UtcDateTime))
                .ToList(),
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

    private sealed record CallerOrder(DateTimeOffset OccurredOn, int PriceCents);
}
