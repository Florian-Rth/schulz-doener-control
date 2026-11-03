using Schulz.DoenerControl.Application.Calculators;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests;

public sealed class GameScoreRulesTests
{
    [Theory]
    [InlineData(0, 0, 0)]
    [InlineData(270, 3, 5)]
    [InlineData(900, 10, 110)]
    public void Should_Accept_Round_When_The_Game_Can_Produce_It(int score, int hits, int misses)
    {
        Assert.True(GameScoreRules.IsPlausible(score, hits, misses));
    }

    [Theory]
    [InlineData(271, 3, 0)]
    [InlineData(10, 0, 0)]
    [InlineData(0, 61, 60)]
    [InlineData(-5, 1, 0)]
    [InlineData(0, 0, -1)]
    public void Should_Reject_Round_When_The_Game_Cannot_Produce_It(int score, int hits, int misses)
    {
        Assert.False(GameScoreRules.IsPlausible(score, hits, misses));
    }

    [Fact]
    public void Should_Rank_Each_Players_Best_Round_When_They_Played_Several()
    {
        var anna = Guid.NewGuid();
        var ben = Guid.NewGuid();
        var at = DateTimeOffset.UnixEpoch;
        var rounds = new[]
        {
            new GameRoundInput(anna, "Anna Alt", "#000000", 100, 5, 1, at),
            new GameRoundInput(anna, "Anna Alt", "#000000", 300, 9, 0, at),
            new GameRoundInput(ben, "Ben Bach", "#111111", 200, 7, 2, at),
        };

        var board = GameLeaderboardRanker.Rank(rounds, ben, 5);

        Assert.Equal(new[] { 300, 200 }, board.Select(row => row.Score));
        Assert.Equal(new[] { "AA", "BB" }, board.Select(row => row.Initials));
        Assert.True(board[1].IsCurrentUser);
    }
}
