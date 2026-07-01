using System.Globalization;
using FastEndpoints;
using Schulz.DoenerControl.Application.Calculators;
using Schulz.DoenerControl.Application.Dashboard;
using Schulz.DoenerControl.Application.Debts;
using Schulz.DoenerControl.Application.Leaderboards;
using Schulz.DoenerControl.Application.OrderDays;
using Schulz.DoenerControl.Application.Security;
using Schulz.DoenerControl.Application.Users;

namespace Schulz.DoenerControl.Api.Endpoints.Dashboard;

// The four "Werks-Überwachung" tiles. Money labels are the bare German number (no " €" suffix) —
// the SPA appends its own unit; the count label carries German thousands grouping ("1.337").
public sealed record DashboardStatsDto(
    int TotalDoener,
    string TotalDoenerLabel,
    int MonthSpendCents,
    string MonthSpendLabel,
    int OpenPaymentsCount,
    int StreakWeeks
);

public sealed record DashboardTierDto(
    string Emoji,
    string Name,
    string Tagline,
    IReadOnlyList<string> Tags,
    int OrderCount
);

public sealed record DashboardLeaderboardRowDto(
    int Rank,
    Guid UserId,
    string DisplayName,
    string AvatarColorHex,
    int Count,
    bool IsMe,
    string? Medal,
    string? TierEmoji
);

public sealed record DashboardLeaderboardDto(
    int Year,
    IReadOnlyList<DashboardLeaderboardRowDto> Rows,
    int? DoenerToNextRank,
    int? NextRank
);

// Today's Döner-Tag flattened (the SPA switches on IsOpen): the rich fields are populated only when
// a day exists; null/empty otherwise. Order price labels are the bare German number. IsOrderingClosed
// and AmICollector drive the collector close-ordering/close-day controls; Abholer is the designated
// pickup person (null until one is set), carrying the caller-specific PayPal reimbursement link.
public sealed record DashboardDayDto(
    bool IsOpen,
    Guid? Id,
    string? Synonym,
    string? PushText,
    string? CutoffLabel,
    int ParticipantCount,
    IReadOnlyList<string> PickupNames,
    bool ICanStillOrder,
    bool IsOrderingClosed,
    bool AmICollector,
    DashboardAbholerDto? Abholer,
    IReadOnlyList<DashboardOrderRowDto> Orders,
    // The Abholer's printable order sheet, built server-side: numbered per-package lines in
    // article-type order + the grouped "für die Theke" shop summary (identical to the e-mailed PDF).
    IReadOnlyList<DashboardPrintLineDto> PrintLines,
    IReadOnlyList<DashboardPrintSummaryDto> PrintSummary
);

public sealed record DashboardAbholerDto(
    string Name,
    string Initials,
    string ColorHex,
    string? PayPalUrl
);

public sealed record DashboardOrderRowDto(
    Guid OrderId,
    string PersonName,
    string AvatarColorHex,
    string ProductLabel,
    string Description,
    int PriceCents,
    string PriceLabel,
    bool IsMine,
    bool IsPickup
);

// One numbered package line on the Abholer's print sheet (LineTotalCents is the line's own total —
// Quantity × unit price; the frontend formats it and the grand total).
public sealed record DashboardPrintLineDto(
    int Number,
    string Section,
    string PersonName,
    string ProductLabel,
    string Description,
    int Quantity,
    int LineTotalCents,
    bool IsPickup
);

// One grouped "n× …" line of the shop summary.
public sealed record DashboardPrintSummaryDto(string Label, int Quantity);

public sealed record DashboardDebtRowDto(
    Guid Id,
    string CreditorName,
    string CreditorAvatarColorHex,
    string Reason,
    string? DayLabel,
    int AmountCents,
    string AmountLabel,
    string? PaypalUrl
);

public sealed record DashboardDebtsDto(
    int OpenCount,
    int TotalCents,
    string TotalLabel,
    IReadOnlyList<DashboardDebtRowDto> Rows
);

public sealed record GetDashboardResponse(
    string FirstName,
    string DisplayName,
    string AvatarColorHex,
    DashboardStatsDto Stats,
    DashboardTierDto Tier,
    DashboardLeaderboardDto Leaderboard,
    DashboardDayDto Day,
    DashboardDebtsDto Debts,
    string? Toast
);

// The home-screen aggregate (PLAN #8): the greeting identity + stats + the caller's Döner-Tier + the
// current-year leaderboard + today's Döner-Tag + the caller's open debts, in one round-trip. Shaped
// to the frontend DashboardSchema (bare money labels, a flat day object). Authenticated.
public sealed class GetDashboard : EndpointWithoutRequest<GetDashboardResponse>
{
    private static readonly CultureInfo German = CultureInfo.GetCultureInfo("de-DE");

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
            details.Caller.FirstName,
            details.Caller.DisplayName,
            details.Caller.AvatarColorHex,
            MapStats(details.Stats),
            MapTier(details.Tier),
            MapLeaderboard(details.Leaderboard),
            MapDay(details.Today),
            MapDebts(details.OpenDebts),
            details.Toast
        );

    private static DashboardStatsDto MapStats(DashboardStatsDetails stats) =>
        new(
            stats.TotalLifetimeCount,
            stats.TotalLifetimeCount.ToString("N0", German),
            stats.MonthlySpendCents,
            StripEuro(stats.MonthlySpendLabel),
            stats.OpenPaymentsCount,
            stats.StreakWeeks
        );

    private static DashboardTierDto MapTier(DoenerTier tier) =>
        new(tier.Emoji, tier.Name, tier.Tagline, tier.Tags, tier.Count);

    private static DashboardLeaderboardDto MapLeaderboard(LeaderboardDetails leaderboard) =>
        new(
            leaderboard.Year,
            leaderboard.Entries.Select(MapLeaderboardRow).ToList(),
            leaderboard.DoenerToNextRank,
            leaderboard.NextRank
        );

    private static DashboardLeaderboardRowDto MapLeaderboardRow(LeaderboardEntryDetails entry) =>
        new(
            entry.Rank,
            entry.UserId,
            entry.DisplayName,
            entry.AvatarColorHex,
            entry.Count,
            entry.IsCurrentUser,
            MedalFor(entry.Rank),
            entry.TierEmoji
        );

    private static DashboardDayDto MapDay(OrderDayDetails? day)
    {
        if (day is null)
        {
            return new DashboardDayDto(
                IsOpen: false,
                Id: null,
                Synonym: null,
                PushText: null,
                CutoffLabel: null,
                ParticipantCount: 0,
                PickupNames: [],
                ICanStillOrder: false,
                IsOrderingClosed: false,
                AmICollector: false,
                Abholer: null,
                Orders: [],
                PrintLines: [],
                PrintSummary: []
            );
        }

        return new DashboardDayDto(
            IsOpen: true,
            day.Id,
            day.Synonym,
            day.PushText,
            day.CutoffLabel,
            day.ParticipantCount,
            day.PickupNames,
            day.ICanStillOrder,
            day.IsOrderingClosed,
            day.AmICollector,
            MapAbholer(day.Abholer),
            day.Orders.Select(MapOrderRow).ToList(),
            day.PrintList.Lines.Select(MapPrintLine).ToList(),
            day.PrintList.Summary.Select(MapPrintSummary).ToList()
        );
    }

    private static DashboardPrintLineDto MapPrintLine(PrintLineSummary line) =>
        new(
            line.Number,
            line.Section,
            line.PersonName,
            line.ProductLabel,
            line.Description,
            line.Quantity,
            line.LineTotalCents,
            line.IsPickup
        );

    private static DashboardPrintSummaryDto MapPrintSummary(PrintSummaryLine line) =>
        new(line.Label, line.Quantity);

    private static DashboardAbholerDto? MapAbholer(AbholerSummary? abholer) =>
        abholer is null
            ? null
            : new DashboardAbholerDto(
                abholer.Name,
                abholer.Initials,
                abholer.ColorHex,
                abholer.PayPalUrl
            );

    private static DashboardOrderRowDto MapOrderRow(OrderRowSummary row) =>
        new(
            row.OrderId,
            row.PersonName,
            row.AvatarColorHex,
            row.ProductLabel,
            row.Description,
            row.PriceCents,
            StripEuro(row.PriceLabel),
            row.IsMine,
            row.IsPickup
        );

    private static DashboardDebtsDto MapDebts(DebtLedgerDetails ledger) =>
        new(
            ledger.OpenCount,
            ledger.TotalCents,
            StripEuro(ledger.TotalLabel),
            ledger.Debts.Select(MapDebtRow).ToList()
        );

    private static DashboardDebtRowDto MapDebtRow(DebtSummary debt) =>
        new(
            debt.Id,
            debt.PersonName,
            debt.AvatarColorHex,
            debt.Reason,
            debt.DayLabel,
            debt.AmountCents,
            StripEuro(debt.AmountLabel),
            debt.PaypalUrl
        );

    // The shared MoneyFormatter renders "8,50 €"; the dashboard cards append their own " €" unit, so
    // the aggregate carries the bare German number to avoid a double euro sign.
    private static string StripEuro(string germanLabel) =>
        germanLabel.Replace(" €", string.Empty, StringComparison.Ordinal).Trim();

    private static string? MedalFor(int rank) =>
        rank switch
        {
            1 => "🥇",
            2 => "🥈",
            3 => "🥉",
            _ => null,
        };
}
