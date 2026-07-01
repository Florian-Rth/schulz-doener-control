using Schulz.DoenerControl.Application.Calculators;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests;

// Pure-logic unit tests for leaderboard ranking: per-user counts -> ordered rows with DENSE ranks
// (ties share a rank, the next distinct count is the very next rank — 1,2,2,3, never skipping), the
// current-user highlight, and the "nur noch X bis Platz N" diff.
public sealed class LeaderboardCalculatorTests
{
    private static readonly Guid Tobias = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid Lukas = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid Sara = Guid.Parse("33333333-3333-3333-3333-333333333333");
    private static readonly Guid Markus = Guid.Parse("44444444-4444-4444-4444-444444444444");

    // The mock's 2026 leaderboard: Tobias 142, Lukas 119, Sara 97, Markus 91 (current user, rank 4).
    private static IReadOnlyList<LeaderboardEntryInput> MockCounts() =>
        new[]
        {
            new LeaderboardEntryInput(Sara, "Sara Yılmaz", 97),
            new LeaderboardEntryInput(Markus, "Markus Wagner", 91),
            new LeaderboardEntryInput(Tobias, "Tobias Klein", 142),
            new LeaderboardEntryInput(Lukas, "Lukas Brandt", 119),
        };

    [Fact]
    public void Should_Order_Rows_By_Count_Descending()
    {
        var board = LeaderboardCalculator.Rank(MockCounts(), Markus);

        Assert.Equal(new[] { Tobias, Lukas, Sara, Markus }, board.Rows.Select(r => r.UserId));
        Assert.Equal(new[] { 142, 119, 97, 91 }, board.Rows.Select(r => r.Count));
    }

    [Fact]
    public void Should_Assign_Sequential_Ranks_When_No_Ties()
    {
        var board = LeaderboardCalculator.Rank(MockCounts(), Markus);

        Assert.Equal(new[] { 1, 2, 3, 4 }, board.Rows.Select(r => r.Rank));
    }

    [Fact]
    public void Should_Highlight_Current_User_Row()
    {
        var board = LeaderboardCalculator.Rank(MockCounts(), Markus);

        var markusRow = board.Rows.Single(r => r.UserId == Markus);
        Assert.True(markusRow.IsCurrentUser);
        Assert.All(board.Rows.Where(r => r.UserId != Markus), r => Assert.False(r.IsCurrentUser));
    }

    [Fact]
    public void Should_Derive_Initials_For_Each_Row()
    {
        var board = LeaderboardCalculator.Rank(MockCounts(), Markus);

        Assert.Equal("MW", board.Rows.Single(r => r.UserId == Markus).Initials);
        Assert.Equal("TK", board.Rows.Single(r => r.UserId == Tobias).Initials);
    }

    [Fact]
    public void Should_Report_Diff_And_Target_Rank_To_Next_Higher_Colleague()
    {
        var board = LeaderboardCalculator.Rank(MockCounts(), Markus);

        // Markus 91 -> Sara 97 is the next-higher count (97 - 91 = 6) at rank 3.
        Assert.Equal(6, board.NextRankDiff);
        Assert.Equal(3, board.NextRank);
    }

    [Fact]
    public void Should_Report_No_Next_Rank_When_Current_User_Leads()
    {
        var board = LeaderboardCalculator.Rank(MockCounts(), Tobias);

        Assert.Null(board.NextRankDiff);
        Assert.Null(board.NextRank);
    }

    [Fact]
    public void Should_Use_Dense_Ranking_When_Tie_For_First()
    {
        var counts = new[]
        {
            new LeaderboardEntryInput(Tobias, "Tobias Klein", 100),
            new LeaderboardEntryInput(Lukas, "Lukas Brandt", 100),
            new LeaderboardEntryInput(Sara, "Sara Yılmaz", 80),
        };

        var board = LeaderboardCalculator.Rank(counts, Sara);

        // Two tied at rank 1, the next distinct count is rank 2 (dense ranking — never skips a rank).
        Assert.Equal(1, board.Rows.Single(r => r.UserId == Tobias).Rank);
        Assert.Equal(1, board.Rows.Single(r => r.UserId == Lukas).Rank);
        Assert.Equal(2, board.Rows.Single(r => r.UserId == Sara).Rank);
    }

    [Fact]
    public void Should_Not_Skip_A_Rank_After_A_Middle_Tie()
    {
        // The exact scenario from the bug report: 3, 2, 2, 1, 1 → ranks 1, 2, 2, 3, 3 (never a gap).
        var counts = new[]
        {
            new LeaderboardEntryInput(Tobias, "Tobias Klein", 3),
            new LeaderboardEntryInput(Lukas, "Lukas Brandt", 2),
            new LeaderboardEntryInput(Sara, "Sara Yılmaz", 2),
            new LeaderboardEntryInput(Markus, "Markus Wagner", 1),
        };

        var board = LeaderboardCalculator.Rank(counts, Markus);

        Assert.Equal(1, board.Rows.Single(r => r.UserId == Tobias).Rank);
        Assert.Equal(2, board.Rows.Single(r => r.UserId == Lukas).Rank);
        Assert.Equal(2, board.Rows.Single(r => r.UserId == Sara).Rank);
        Assert.Equal(3, board.Rows.Single(r => r.UserId == Markus).Rank);
    }

    [Fact]
    public void Should_Skip_Tied_Peers_When_Computing_Next_Rank_Diff()
    {
        var counts = new[]
        {
            new LeaderboardEntryInput(Tobias, "Tobias Klein", 100),
            new LeaderboardEntryInput(Lukas, "Lukas Brandt", 80),
            new LeaderboardEntryInput(Sara, "Sara Yılmaz", 80),
        };

        var board = LeaderboardCalculator.Rank(counts, Lukas);

        // Lukas is tied with Sara at 80; the next-higher count is Tobias 100 at rank 1.
        Assert.Equal(20, board.NextRankDiff);
        Assert.Equal(1, board.NextRank);
    }

    [Fact]
    public void Should_Return_Empty_Board_When_No_Orders()
    {
        var board = LeaderboardCalculator.Rank(Array.Empty<LeaderboardEntryInput>(), Markus);

        Assert.Empty(board.Rows);
        Assert.Null(board.NextRankDiff);
        Assert.Null(board.NextRank);
    }
}
