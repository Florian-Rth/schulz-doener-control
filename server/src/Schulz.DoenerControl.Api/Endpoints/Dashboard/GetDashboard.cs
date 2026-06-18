using FastEndpoints;
using Schulz.DoenerControl.Api.Endpoints.Debts;
using Schulz.DoenerControl.Application.Calculators;
using Schulz.DoenerControl.Application.Dashboard;
using Schulz.DoenerControl.Application.Security;

namespace Schulz.DoenerControl.Api.Endpoints.Dashboard;

public sealed record DashboardStatsDto(
    int TotalLifetimeCount,
    int MonthlySpendCents,
    string MonthlySpendLabel,
    int OpenPaymentsCount,
    int OpenPaymentsTotalCents,
    string OpenPaymentsTotalLabel,
    int StreakWeeks
);

public sealed record DashboardTierDto(
    string Emoji,
    string Name,
    string Tagline,
    IReadOnlyList<string> Tags,
    int Count
);

public sealed record DashboardLeaderboardRowDto(
    Guid UserId,
    string DisplayName,
    string Initials,
    int Count,
    int Rank,
    bool IsCurrentUser
);

public sealed record DashboardLeaderboardDto(
    IReadOnlyList<DashboardLeaderboardRowDto> Rows,
    int? NextRankDiff,
    int? NextRank
);

public sealed record DashboardOpenDebtsDto(
    int OpenCount,
    int TotalCents,
    string TotalLabel,
    IReadOnlyList<DebtSummaryDto> Debts
);

public sealed record GetDashboardResponse(
    DashboardStatsDto Stats,
    DashboardTierDto Tier,
    DashboardLeaderboardDto Leaderboard,
    DashboardOpenDebtsDto OpenDebts
);

// The home-screen aggregate (PLAN #8): stats + the caller's Döner-Tier + the current-year
// leaderboard + the caller's open debts, in one round-trip. Authenticated.
public sealed class GetDashboard : EndpointWithoutRequest<GetDashboardResponse>
{
    private readonly IDashboardService dashboardService;
    private readonly ICurrentUser currentUser;

    public GetDashboard(IDashboardService dashboardService, ICurrentUser currentUser)
    {
        this.dashboardService = dashboardService;
        this.currentUser = currentUser;
    }

    public override void Configure()
    {
        Get("/api/dashboard");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        if (currentUser.UserId is not { } callerId)
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var result = await dashboardService.GetAsync(callerId, ct);
        if (!result.IsSuccess)
        {
            await Send.ErrorsAsync(cancellation: ct);
            return;
        }

        await Send.OkAsync(MapToResponse(result.Value), cancellation: ct);
    }

    private static GetDashboardResponse MapToResponse(DashboardDetails details) =>
        new(
            MapStats(details.Stats),
            MapTier(details.Tier),
            MapLeaderboard(details.Leaderboard),
            MapOpenDebts(details.OpenDebts)
        );

    private static DashboardStatsDto MapStats(DashboardStatsDetails stats) =>
        new(
            stats.TotalLifetimeCount,
            stats.MonthlySpendCents,
            stats.MonthlySpendLabel,
            stats.OpenPaymentsCount,
            stats.OpenPaymentsTotalCents,
            stats.OpenPaymentsTotalLabel,
            stats.StreakWeeks
        );

    private static DashboardTierDto MapTier(DoenerTier tier) =>
        new(tier.Emoji, tier.Name, tier.Tagline, tier.Tags, tier.Count);

    private static DashboardLeaderboardDto MapLeaderboard(Leaderboard leaderboard) =>
        new(
            leaderboard
                .Rows.Select(row => new DashboardLeaderboardRowDto(
                    row.UserId,
                    row.DisplayName,
                    row.Initials,
                    row.Count,
                    row.Rank,
                    row.IsCurrentUser
                ))
                .ToList(),
            leaderboard.NextRankDiff,
            leaderboard.NextRank
        );

    private static DashboardOpenDebtsDto MapOpenDebts(
        Schulz.DoenerControl.Application.Debts.DebtLedgerDetails ledger
    ) =>
        new(
            ledger.OpenCount,
            ledger.TotalCents,
            ledger.TotalLabel,
            ledger.Debts.Select(DebtMapper.ToRowDto).ToList()
        );
}
