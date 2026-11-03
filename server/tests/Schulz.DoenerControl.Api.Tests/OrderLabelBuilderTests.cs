using Schulz.DoenerControl.Application.Calculators;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Core.Enums;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests;

// Pure-logic tests for the generic order row label/description builder. The product label is just the
// resolved (base, for presets) product name; the description joins the selected options' labels — in
// category field order, then option order — and the free-text answers with " · ".
public sealed class OrderLabelBuilderTests
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
                    new OptionSpec("kalb", "Kalb", null, 0, true),
                    new OptionSpec("haehnchen", "Hähnchen", null, 0, true),
                    new OptionSpec("gemischt", "Gemischt", null, 0, true),
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
                    new OptionSpec("kraeuter", "Kräuter", "🌿", 0, true),
                    new OptionSpec("knoblauch", "Knoblauch", "🧄", 0, true),
                    new OptionSpec("scharf", "Scharf", "🌶", 0, true),
                ]
            ),
            new FieldSpec(
                "extra",
                "Extrawünsche",
                FieldType.Text,
                FieldDisplay.Textarea,
                Required: false,
                MaxLength: 256,
                []
            ),
        ]
    );

    [Fact]
    public void Should_Return_ProductName_As_Label()
    {
        Assert.Equal("Dürüm", OrderLabelBuilder.BuildProductLabel("Dürüm"));
    }

    [Fact]
    public void Should_Join_Option_Labels_In_Field_And_Option_Order()
    {
        var description = OrderLabelBuilder.BuildDescription(
            Doener,
            TestAnswers.Build("kalb", ["kraeuter", "knoblauch", "scharf"], null, null)
        );

        Assert.Equal("Kalb · Kräuter · Knoblauch · Scharf", description);
    }

    [Fact]
    public void Should_Append_Extra_Text_After_Options()
    {
        var description = OrderLabelBuilder.BuildDescription(
            Doener,
            TestAnswers.Build("kalb", ["scharf"], null, "ohne Zwiebeln")
        );

        Assert.Equal("Kalb · Scharf · ohne Zwiebeln", description);
    }

    [Fact]
    public void Should_Render_Standard_When_No_Answers()
    {
        Assert.Equal("Standard", OrderLabelBuilder.BuildDescription(Doener, LineAnswers.Empty));
    }

    [Fact]
    public void Should_Render_Standard_When_Category_Unknown()
    {
        var description = OrderLabelBuilder.BuildDescription(
            null,
            TestAnswers.Build("kalb", [], null, null)
        );

        Assert.Equal("Standard", description);
    }
}
