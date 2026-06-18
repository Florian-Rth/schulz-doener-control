using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Application.Leaderboards;
using Schulz.DoenerControl.Application.Security;

namespace Schulz.DoenerControl.Api.Endpoints.Leaderboards;

public sealed class GetLeaderboardRequest
{
    // Optional ?year= query parameter; defaults to the current calendar year server-side.
    [QueryParam]
    public int? Year { get; set; }
}

public sealed record LeaderboardEntrySummaryDto(
    int Rank,
    Guid UserId,
    string DisplayName,
    string Initials,
    string AvatarColorHex,
    int Count,
    bool IsMe,
    string? Medal
);

public sealed record GetLeaderboardResponse(
    int Year,
    IReadOnlyList<LeaderboardEntrySummaryDto> Entries,
    int? DoenerToNextRank,
    int? NextRank
);

public sealed class GetLeaderboardRequestValidator : Validator<GetLeaderboardRequest>
{
    public GetLeaderboardRequestValidator()
    {
        When(
            request => request.Year.HasValue,
            () => RuleFor(request => request.Year!.Value).InclusiveBetween(2020, 2100)
        );
    }
}

// The Döner-Bestenliste (PLAN slice 22): per-year order counts per active user, ranked, medals for
// the top three, the current user flagged, and the "nur noch X bis Platz N" gap. Authenticated; the
// year defaults to the current calendar year when omitted.
public sealed class GetLeaderboard : Endpoint<GetLeaderboardRequest, GetLeaderboardResponse>
{
    private readonly ILeaderboardService leaderboardService;
    private readonly ICurrentUser currentUser;
    private readonly TimeProvider timeProvider;

    public GetLeaderboard(
        ILeaderboardService leaderboardService,
        ICurrentUser currentUser,
        TimeProvider timeProvider
    )
    {
        this.leaderboardService = leaderboardService;
        this.currentUser = currentUser;
        this.timeProvider = timeProvider;
    }

    public override void Configure()
    {
        Get("/api/leaderboard");
    }

    public override async Task HandleAsync(GetLeaderboardRequest req, CancellationToken ct)
    {
        if (currentUser.UserId is not { } callerId)
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var year = req.Year ?? timeProvider.GetUtcNow().Year;
        var result = await leaderboardService.GetForYearAsync(
            new GetLeaderboardQuery(year, callerId),
            ct
        );

        if (!result.IsSuccess)
        {
            await Send.ErrorsAsync(cancellation: ct);
            return;
        }

        await Send.OkAsync(MapToResponse(result.Value), cancellation: ct);
    }

    private static GetLeaderboardResponse MapToResponse(LeaderboardDetails details) =>
        new(
            details.Year,
            details.Entries.Select(MapEntry).ToList(),
            details.DoenerToNextRank,
            details.NextRank
        );

    private static LeaderboardEntrySummaryDto MapEntry(LeaderboardEntryDetails entry) =>
        new(
            entry.Rank,
            entry.UserId,
            entry.DisplayName,
            entry.Initials,
            entry.AvatarColorHex,
            entry.Count,
            entry.IsCurrentUser,
            MedalFor(entry.Rank)
        );

    private static string? MedalFor(int rank) =>
        rank switch
        {
            1 => "🥇",
            2 => "🥈",
            3 => "🥉",
            _ => null,
        };
}
