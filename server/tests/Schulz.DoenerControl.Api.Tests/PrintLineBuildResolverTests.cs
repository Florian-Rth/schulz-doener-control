using Schulz.DoenerControl.Application.Calculators;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Core.Enums;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests;

// Pure-logic tests for the structured Döner answers on the Abholer's print lines: the counter mode
// rebuilds the Döner in 3D from the meat key, the sauce keys and the free text, and only shows the
// stage for bread-based Döner (meat single + sauce multi, no box/plate by name).
public sealed class PrintLineBuildResolverTests
{
    private static readonly FieldSpec Meat = new(
        "meat",
        "Fleisch",
        FieldType.SingleSelect,
        FieldDisplay.Segmented,
        Required: true,
        MaxLength: null,
        [new OptionSpec("kalb", "Kalb", null, 0, true)]
    );

    private static readonly FieldSpec Sauce = new(
        "sauce",
        "Soße",
        FieldType.MultiSelect,
        FieldDisplay.Chips,
        Required: false,
        MaxLength: null,
        [
            new OptionSpec("knoblauch", "Knoblauch", null, 0, true),
            new OptionSpec("scharf", "Scharf", null, 0, true),
        ]
    );

    private static readonly FieldSpec Variant = new(
        "variant",
        "Sorte",
        FieldType.SingleSelect,
        FieldDisplay.Chips,
        Required: true,
        MaxLength: null,
        [new OptionSpec("salami", "Salami", null, 0, true)]
    );

    private static readonly FieldSpec Extra = new(
        "extra",
        "Extrawünsche",
        FieldType.Text,
        FieldDisplay.Textarea,
        Required: false,
        MaxLength: 256,
        []
    );

    private static readonly CategorySpec Doener = new("doener", [Meat, Sauce, Extra]);

    private static readonly CategorySpec Pizza = new("pizza", [Variant, Extra]);

    private static LineAnswers DoenerAnswers(string? extra) =>
        TestAnswers.Build("kalb", ["scharf", "knoblauch"], variant: null, extra);

    [Fact]
    public void Should_Carry_Meat_Sauces_And_Text_When_Bread_Doener()
    {
        var build = PrintLineBuildResolver.Resolve(
            Doener,
            DoenerAnswers("  ohne Zwiebeln, Soße separat "),
            ["Döner"]
        );

        Assert.Equal("kalb", build.MeatKey);
        Assert.Equal(new[] { "scharf", "knoblauch" }, build.SauceKeys);
        Assert.Equal("ohne Zwiebeln, Soße separat", build.ExtraText);
        Assert.True(build.IsBreadDoener);
    }

    [Fact]
    public void Should_Use_Empty_Text_When_No_Free_Text_Answer()
    {
        var build = PrintLineBuildResolver.Resolve(Doener, DoenerAnswers(null), ["Dürüm"]);

        Assert.Equal(string.Empty, build.ExtraText);
        Assert.True(build.IsBreadDoener);
    }

    [Theory]
    [InlineData("Dönerbox")]
    [InlineData("Danny-Box")]
    [InlineData("Dönerteller")]
    public void Should_Not_Be_Bread_Doener_When_Name_Is_Box_Or_Plate(string productName)
    {
        var build = PrintLineBuildResolver.Resolve(Doener, DoenerAnswers(null), [productName]);

        Assert.False(build.IsBreadDoener);
        Assert.Equal("kalb", build.MeatKey);
    }

    [Fact]
    public void Should_Not_Be_Bread_Doener_When_Any_Name_Is_A_Box()
    {
        var build = PrintLineBuildResolver.Resolve(
            Doener,
            DoenerAnswers(null),
            ["Danny-Spezial", "Dönerbox"]
        );

        Assert.False(build.IsBreadDoener);
    }

    [Fact]
    public void Should_Not_Be_Bread_Doener_When_Category_Lacks_Meat_And_Sauce()
    {
        var answers = TestAnswers.Build(null, [], "salami", "extra Käse");

        var build = PrintLineBuildResolver.Resolve(Pizza, answers, ["Pizza"]);

        Assert.False(build.IsBreadDoener);
        Assert.Null(build.MeatKey);
        Assert.Empty(build.SauceKeys);
        Assert.Equal("extra Käse", build.ExtraText);
    }

    [Fact]
    public void Should_Not_Be_Bread_Doener_When_Category_Unknown()
    {
        var build = PrintLineBuildResolver.Resolve(null, DoenerAnswers("mit allem"), ["Döner"]);

        Assert.False(build.IsBreadDoener);
        Assert.Equal(string.Empty, build.ExtraText);
    }
}
