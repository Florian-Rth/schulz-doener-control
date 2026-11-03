using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Application.Game;

public interface IGameScoreService
{
    // Stores a round, tied to today's Döner-Tag when there is one. Validation when implausible.
    Task<Result<GameScoreDetails>> SubmitAsync(
        SubmitGameScoreCommand command,
        CancellationToken ct
    );

    Task<Result<GameLeaderboardDetails>> GetLeaderboardAsync(Guid callerId, CancellationToken ct);
}
