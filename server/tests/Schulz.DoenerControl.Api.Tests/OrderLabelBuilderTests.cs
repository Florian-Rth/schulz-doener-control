using Schulz.DoenerControl.Application.Calculators;
using Schulz.DoenerControl.Core.Enums;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests;

// Pure-logic tests for the order row label/description builders. They port the mock's
// productLabel/detail helpers exactly so the Döner-Tag list reads the way the mock does.
public sealed class OrderLabelBuilderTests
{
    [Fact]
    public void Should_Build_Doener_Label_With_Meat_When_Doener_Kind()
    {
        var label = OrderLabelBuilder.BuildProductLabel(
            ProductKind.Doener,
            "Dürüm",
            MeatType.Kalb,
            null
        );

        Assert.Equal("Dürüm Kalb", label);
    }

    [Fact]
    public void Should_Build_Doener_Label_With_Gemischt_When_Mixed_Meat()
    {
        var label = OrderLabelBuilder.BuildProductLabel(
            ProductKind.Doener,
            "Döner",
            MeatType.Gemischt,
            null
        );

        Assert.Equal("Döner Gemischt", label);
    }

    [Fact]
    public void Should_Build_Pizza_Label_With_Variant_When_Pizza_Kind()
    {
        var label = OrderLabelBuilder.BuildProductLabel(ProductKind.Pizza, "Pizza", null, "Salami");

        Assert.Equal("Pizza Salami", label);
    }

    [Fact]
    public void Should_Build_Bare_Pizza_Label_When_Variant_Name_Missing()
    {
        var label = OrderLabelBuilder.BuildProductLabel(ProductKind.Pizza, "Pizza", null, null);

        Assert.Equal("Pizza", label);
    }

    [Fact]
    public void Should_Join_Sauces_In_Vocabulary_Order_When_Multiple_Selected()
    {
        var description = OrderLabelBuilder.BuildDescription(
            ProductKind.Doener,
            Sauce.Scharf | Sauce.Knoblauch | Sauce.Kraeuter,
            null
        );

        Assert.Equal("Kräuter, Knoblauch, Scharf", description);
    }

    [Fact]
    public void Should_Append_Extra_With_Separator_When_Extra_Given()
    {
        var description = OrderLabelBuilder.BuildDescription(
            ProductKind.Doener,
            Sauce.Scharf,
            "ohne Zwiebeln"
        );

        Assert.Equal("Scharf · ohne Zwiebeln", description);
    }

    [Fact]
    public void Should_Render_Ohne_Soße_When_No_Sauce_On_Doener()
    {
        var description = OrderLabelBuilder.BuildDescription(ProductKind.Doener, Sauce.None, null);

        Assert.Equal("ohne Soße", description);
    }

    [Fact]
    public void Should_Render_Standard_When_Pizza_Has_No_Extra()
    {
        var description = OrderLabelBuilder.BuildDescription(ProductKind.Pizza, Sauce.None, null);

        Assert.Equal("Standard", description);
    }

    [Fact]
    public void Should_Render_Only_Extra_When_Pizza_Has_Extra()
    {
        var description = OrderLabelBuilder.BuildDescription(
            ProductKind.Pizza,
            Sauce.None,
            "extra Käse"
        );

        Assert.Equal("extra Käse", description);
    }
}
