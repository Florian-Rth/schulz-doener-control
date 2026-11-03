using Schulz.DoenerControl.Application.Calculators;
using Schulz.DoenerControl.Core;
using Schulz.DoenerControl.Core.Enums;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests;

// Pure-logic tests for the write-boundary answer guard: required fields, single/multi membership,
// text max-length, and unknown-key rejection, over a döner-like category spec.
public sealed class AnswerValidatorTests
{
    private static readonly CategorySpec Doener = new(
        "doener",
        [
            new FieldSpec(
                "meat",
                "Fleisch",
                FieldType.SingleSelect,
                FieldDisplay.Segmented,
                Required: true,
                MaxLength: null,
                [
                    new OptionSpec("kalb", "Kalb", null, 0, IsAvailable: true),
                    new OptionSpec("haehnchen", "Hähnchen", null, 0, IsAvailable: true),
                    new OptionSpec("gemischt", "Gemischt", null, 0, IsAvailable: false),
                ]
            ),
            new FieldSpec(
                "sauce",
                "Soße",
                FieldType.MultiSelect,
                FieldDisplay.Chips,
                Required: false,
                MaxLength: null,
                [
                    new OptionSpec("kraeuter", "Kräuter", null, 0, IsAvailable: true),
                    new OptionSpec("knoblauch", "Knoblauch", null, 0, IsAvailable: true),
                    new OptionSpec("scharf", "Scharf", null, 0, IsAvailable: true),
                ]
            ),
            new FieldSpec(
                "extra",
                "Extrawünsche",
                FieldType.Text,
                FieldDisplay.Textarea,
                Required: false,
                MaxLength: 10,
                []
            ),
        ]
    );

    [Fact]
    public void Should_Succeed_When_Answers_Valid()
    {
        var result = AnswerValidator.Validate(
            Doener,
            TestAnswers.Build("kalb", ["kraeuter", "scharf"], null, "kurz")
        );

        Assert.True(result.IsSuccess);
    }

    [Fact]
    public void Should_Fail_When_Required_Field_Missing()
    {
        var result = AnswerValidator.Validate(
            Doener,
            TestAnswers.Build(null, ["kraeuter"], null, null)
        );

        Assert.Equal(ResultStatus.Validation, result.Status);
    }

    [Fact]
    public void Should_Fail_When_Single_Select_Has_Two_Options()
    {
        var twoMeat = new Core.Entities.LineAnswers(
            new Dictionary<string, Core.Entities.AnswerValue>
            {
                ["meat"] = Core.Entities.AnswerValue.FromOptions("kalb", "haehnchen"),
            }
        );

        var result = AnswerValidator.Validate(Doener, twoMeat);

        Assert.Equal(ResultStatus.Validation, result.Status);
    }

    [Fact]
    public void Should_Fail_When_Single_Select_Option_Unavailable()
    {
        var result = AnswerValidator.Validate(
            Doener,
            TestAnswers.Build("gemischt", [], null, null)
        );

        Assert.Equal(ResultStatus.Validation, result.Status);
    }

    [Fact]
    public void Should_Fail_When_Multi_Select_Has_Unknown_Option()
    {
        var result = AnswerValidator.Validate(
            Doener,
            TestAnswers.Build("kalb", ["ketchup"], null, null)
        );

        Assert.Equal(ResultStatus.Validation, result.Status);
    }

    [Fact]
    public void Should_Fail_When_Text_Exceeds_MaxLength()
    {
        var result = AnswerValidator.Validate(
            Doener,
            TestAnswers.Build("kalb", [], null, "viel zu langer Text")
        );

        Assert.Equal(ResultStatus.Validation, result.Status);
    }

    [Fact]
    public void Should_Fail_When_Unknown_Field_Key()
    {
        var answers = new Core.Entities.LineAnswers(
            new Dictionary<string, Core.Entities.AnswerValue>
            {
                ["meat"] = Core.Entities.AnswerValue.FromOptions("kalb"),
                ["variant"] = Core.Entities.AnswerValue.FromOptions("salami"),
            }
        );

        var result = AnswerValidator.Validate(Doener, answers);

        Assert.Equal(ResultStatus.Validation, result.Status);
    }
}
