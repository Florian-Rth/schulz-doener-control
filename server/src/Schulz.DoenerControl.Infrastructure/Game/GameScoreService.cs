using Microsoft.EntityFrameworkCore;
using Schulz.DoenerControl.Application.Calculators;
using Schulz.DoenerControl.Application.Game;
using Schulz.DoenerControl.Core;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Core.Enums;
using Schulz.DoenerControl.Infrastructure.OrderDays;
using Schulz.DoenerControl.Infrastructure.Persistence;

namespace Schulz.DoenerControl.Infrastructure.Game;

// Stores Döner-Weitwurf rounds and ranks them. Rounds are pulled to memory before ranking (like the
// Döner-Bestenliste): the per-office volume is tiny and SQLite cannot order DateTimeOffset reliably.
public sealed class GameScoreService : IGameScoreService
{
    private const int TodayTake = 10;
    private const int AllTimeTake = 5;

    private readonly AppDbContext database;
    private readonly OrderDayClock clock;

    public GameScoreService(AppDbContext database, OrderDayClock clock)
    {
        this.database = database;
        this.clock = clock;
    }

    public async Task<Result<GameScoreDetails>> SubmitAsync(
        SubmitGameScoreCommand command,
        CancellationToken ct
    )
    {
        if (!GameScoreRules.IsPlausible(command.Score, command.Hits, command.Misses))
            return Result<GameScoreDetails>.Validation(
                "Dieser Wurf ist zu schön, um wahr zu sein."
            );

        var previousBest = await database
            .GameScores.Where(score => score.UserId == command.CallerUserId)
            .MaxAsync(score => (int?)score.Score, ct);

        var entity = new GameScore
        {
            Id = Guid.NewGuid(),
            UserId = command.CallerUserId,
            OrderDayId = await CurrentDayIdAsync(ct),
            Score = command.Score,
            Hits = command.Hits,
            Misses = command.Misses,
            PlayedAt = clock.UtcNow(),
        };
        database.GameScores.Add(entity);
        await database.SaveChangesAsync(ct);

        return Result<GameScoreDetails>.Success(ToDetails(entity, previousBest));
    }

    public async Task<Result<GameLeaderboardDetails>> GetLeaderboardAsync(
        Guid callerId,
        CancellationToken ct
    )
    {
        var dayId = await CurrentDayIdAsync(ct);
        var rounds = await LoadRoundsAsync(ct);

        var today = dayId is { } id
            ? GameLeaderboardRanker.Rank(
                rounds.Where(round => round.OrderDayId == id).Select(round => round.Input),
                callerId,
                TodayTake
            )
            : [];
        var allTime = GameLeaderboardRanker.Rank(
            rounds.Select(round => round.Input),
            callerId,
            AllTimeTake
        );

        return Result<GameLeaderboardDetails>.Success(new GameLeaderboardDetails(today, allTime));
    }

    private async Task<List<StoredRound>> LoadRoundsAsync(CancellationToken ct) =>
        await database
            .GameScores.AsNoTracking()
            .Where(score => score.User != null && score.User.IsActive)
            .Select(score => new StoredRound(
                score.OrderDayId,
                new GameRoundInput(
                    score.UserId,
                    score.User!.DisplayName,
                    score.User!.AvatarColorHex,
                    score.Score,
                    score.Hits,
                    score.Misses,
                    score.PlayedAt
                )
            ))
            .ToListAsync(ct);

    // Today's Döner-Tag: the open one, else the latest one closed earlier today.
    private async Task<Guid?> CurrentDayIdAsync(CancellationToken ct)
    {
        var today = clock.Today();
        var days = await database
            .OrderDays.AsNoTracking()
            .Where(day => day.Date == today)
            .Select(day => new
            {
                day.Id,
                day.Status,
                day.OpenedAt,
            })
            .ToListAsync(ct);

        return days.OrderByDescending(day => day.Status == OrderDayStatus.Open)
            .ThenByDescending(day => day.OpenedAt)
            .Select(day => (Guid?)day.Id)
            .FirstOrDefault();
    }

    private static GameScoreDetails ToDetails(GameScore entity, int? previousBest) =>
        new(
            entity.Id,
            entity.Score,
            entity.Hits,
            entity.Misses,
            entity.OrderDayId,
            entity.Score > 0 && entity.Score > (previousBest ?? 0)
        );

    private sealed record StoredRound(Guid? OrderDayId, GameRoundInput Input);
}
