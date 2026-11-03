using Schulz.DoenerControl.Application.Calculators;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Core.Enums;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests;

// Pure-logic tests for the suggested-price calculator: base + Σ selected-option deltas.
public sealed class LinePriceCalculatorTests
{
    private static readonly CategorySpec Doenerbox = new(
        "doenerbox",
        [
            new FieldSpec(
                "meat",
                "Fleisch",
                FieldType.SingleSelect,
                FieldDisplay.Segmented,
                Required: true,
                MaxLength: null,
                [new OptionSpec("kalb", "Kalb", null, 0, IsAvailable: true)]
            ),
            new FieldSpec(
                "beilage",
                "Beilage",
                FieldType.SingleSelect,
                FieldDisplay.Segmented,
                Required: true,
                MaxLength: null,
                [
                    new OptionSpec("ohne", "Ohne Pommes", null, 0, IsAvailable: true),
                    new OptionSpec("pommes", "Mit Pommes", null, 100, IsAvailable: true),
                ]
            ),
        ]
    );

    private static LineAnswers Answers(string beilage) =>
        new(
            new Dictionary<string, AnswerValue>
            {
                ["meat"] = AnswerValue.FromOptions("kalb"),
                ["beilage"] = AnswerValue.FromOptions(beilage),
            }
        );

    [Fact]
    public void Should_Return_Base_When_No_Deltas_Selected()
    {
        Assert.Equal(600, LinePriceCalculator.SuggestedPriceCents(600, Doenerbox, Answers("ohne")));
    }

    [Fact]
    public void Should_Add_Selected_Option_Delta()
    {
        // Danny lands at 7,00 = box 600 + Pommes 100.
        Assert.Equal(
            700,
            LinePriceCalculator.SuggestedPriceCents(600, Doenerbox, Answers("pommes"))
        );
    }

    [Fact]
    public void Should_Ignore_Unknown_Option_Keys()
    {
        Assert.Equal(
            600,
            LinePriceCalculator.SuggestedPriceCents(600, Doenerbox, Answers("unknown"))
        );
    }
}
