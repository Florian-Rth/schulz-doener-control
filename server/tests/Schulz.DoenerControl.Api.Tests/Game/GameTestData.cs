using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Schulz.DoenerControl.Api.Tests.Auth;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Core.Enums;
using Schulz.DoenerControl.Infrastructure.Persistence;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Game;

// Seeding helpers for the Döner-Weitwurf tests. "Today" is the business day of the fixed test clock.
internal static class GameTestData
{
    public static readonly DateOnly Today = DateOnly.FromDateTime(
        FixedTimeProvider.Instant.DateTime
    );

    public static async Task<AuthTestClient> LoginAsChefAsync(DoenerControlApp app)
    {
        var auth = new AuthTestClient(app.CreateClient());
        await auth.PostJsonAsync(
            "/api/auth/login",
            new { Username = TestSeeding.ChefUsername, Password = TestSeeding.ChefPassword }
        );
        return auth;
    }

    public static async Task<Guid> UserIdAsync(DoenerControlApp app, string normalizedUserName)
    {
        using var scope = app.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return await database
            .Users.Where(user => user.NormalizedUserName == normalizedUserName)
            .Select(user => user.Id)
            .SingleAsync(TestContext.Current.CancellationToken);
    }

    public static async Task<Guid> SeedDayAsync(
        DoenerControlApp app,
        DateOnly date,
        OrderDayStatus status
    )
    {
        var chefId = await UserIdAsync(app, TestSeeding.ChefUsername);
        var day = new OrderDay
        {
            Id = Guid.NewGuid(),
            Date = date,
            Status = status,
            Synonym = "Drehspieß-Tasche",
            OrderCutoffAt = FixedTimeProvider.Instant,
            OpenedByUserId = chefId,
            OpenedAt = FixedTimeProvider.Instant,
        };
        await SeedAsync(app, database => database.OrderDays.Add(day));
        return day.Id;
    }

    public static Task SeedScoreAsync(
        DoenerControlApp app,
        Guid userId,
        Guid? orderDayId,
        int score,
        int hits = 10,
        int misses = 2
    ) =>
        SeedAsync(
            app,
            database =>
                database.GameScores.Add(
                    new GameScore
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        OrderDayId = orderDayId,
                        Score = score,
                        Hits = hits,
                        Misses = misses,
                        PlayedAt = FixedTimeProvider.Instant,
                    }
                )
        );

    public static async Task<List<GameScore>> ScoresOfAsync(DoenerControlApp app, Guid userId)
    {
        using var scope = app.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return await database
            .GameScores.AsNoTracking()
            .Where(score => score.UserId == userId)
            .ToListAsync(TestContext.Current.CancellationToken);
    }

    private static async Task SeedAsync(DoenerControlApp app, Action<AppDbContext> seed)
    {
        using var scope = app.Services.CreateScope();
        var database = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        seed(database);
        await database.SaveChangesAsync(TestContext.Current.CancellationToken);
    }
}
