using FastEndpoints;
using Schulz.DoenerControl.Application.Game;
using Schulz.DoenerControl.Application.Security;

namespace Schulz.DoenerControl.Api.Endpoints.Game;

public sealed record GameScoreSummaryDto(
    int Rank,
    Guid UserId,
    string DisplayName,
    string Initials,
    string AvatarColorHex,
    int Score,
    int Hits,
    bool IsMe
);

public sealed record GetGameLeaderboardResponse(
    IReadOnlyList<GameScoreSummaryDto> Today,
    IReadOnlyList<GameScoreSummaryDto> AllTime
);

// The Weitwurf-Bestenliste: each colleague's best round of today's Döner-Tag (top 10, empty when
// there is no Döner-Tag today) and of all time (top 5). Authenticated.
public sealed class GetGameLeaderboard : EndpointWithoutRequest<GetGameLeaderboardResponse>
{
    private readonly IGameScoreService gameScoreService;
    private readonly ICurrentUser currentUser;

    public GetGameLeaderboard(IGameScoreService gameScoreService, ICurrentUser currentUser)
    {
        this.gameScoreService = gameScoreService;
        this.currentUser = currentUser;
    }

    public override void Configure()
    {
        Get("/api/game/leaderboard");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        if (currentUser.UserId is not { } callerId)
        {
            await Send.UnauthorizedAsync(ct);
            return;
        }

        var result = await gameScoreService.GetLeaderboardAsync(callerId, ct);
        if (!result.IsSuccess)
        {
            await Send.ErrorsAsync(cancellation: ct);
            return;
        }

        await Send.OkAsync(MapToResponse(result.Value), cancellation: ct);
    }

    private static GetGameLeaderboardResponse MapToResponse(GameLeaderboardDetails details) =>
        new(details.Today.Select(MapEntry).ToList(), details.AllTime.Select(MapEntry).ToList());

    private static GameScoreSummaryDto MapEntry(GameScoreSummary entry) =>
        new(
            entry.Rank,
            entry.UserId,
            entry.DisplayName,
            entry.Initials,
            entry.AvatarColorHex,
            entry.Score,
            entry.Hits,
            entry.IsCurrentUser
        );
}
