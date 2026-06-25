using Schulz.DoenerControl.Application.Calculators;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests;

// Pure-logic unit tests for the Packesel pickup-leader selection: the user(s) with the most pickups
// over the window win, but only when that maximum reaches the >= 2 qualifying threshold, and a tie
// at the top hands the title to every user sharing the max.
public sealed class PickupLeaderCalculatorTests
{
    private static readonly Guid Tobias = Guid.Parse("11111111-1111-1111-1111-111111111111");
    private static readonly Guid Lukas = Guid.Parse("22222222-2222-2222-2222-222222222222");
    private static readonly Guid Sara = Guid.Parse("33333333-3333-3333-3333-333333333333");
    private static readonly Guid Markus = Guid.Parse("44444444-4444-4444-4444-444444444444");

    [Fact]
    public void Should_Pick_The_Single_Top_Picker_When_One_Leads()
    {
        var counts = new Dictionary<Guid, int>
        {
            [Tobias] = 5,
            [Lukas] = 3,
            [Sara] = 2,
            [Markus] = 1,
        };

        var winners = PickupLeaderCalculator.WinningUserIds(counts);

        Assert.Equal(new[] { Tobias }, winners);
    }

    [Fact]
    public void Should_Award_All_Tied_Top_Pickers_When_Several_Share_The_Max()
    {
        var counts = new Dictionary<Guid, int>
        {
            [Tobias] = 4,
            [Lukas] = 4,
            [Sara] = 4,
            [Markus] = 2,
        };

        var winners = PickupLeaderCalculator.WinningUserIds(counts);

        Assert.Equal(3, winners.Count);
        Assert.Contains(Tobias, winners);
        Assert.Contains(Lukas, winners);
        Assert.Contains(Sara, winners);
        Assert.DoesNotContain(Markus, winners);
    }

    [Fact]
    public void Should_Award_No_One_When_The_Max_Is_Below_The_Threshold()
    {
        // Everyone has exactly one pickup: the max (1) is below the >= 2 threshold, so no Packesel.
        var counts = new Dictionary<Guid, int>
        {
            [Tobias] = 1,
            [Lukas] = 1,
            [Sara] = 1,
        };

        var winners = PickupLeaderCalculator.WinningUserIds(counts);

        Assert.Empty(winners);
    }

    [Fact]
    public void Should_Award_The_Leader_When_The_Max_Exactly_Meets_The_Threshold()
    {
        var counts = new Dictionary<Guid, int> { [Tobias] = 2, [Lukas] = 1 };

        var winners = PickupLeaderCalculator.WinningUserIds(counts);

        Assert.Equal(new[] { Tobias }, winners);
    }

    [Fact]
    public void Should_Award_No_One_When_There_Are_No_Pickups()
    {
        var winners = PickupLeaderCalculator.WinningUserIds(new Dictionary<Guid, int>());

        Assert.Empty(winners);
    }
}
