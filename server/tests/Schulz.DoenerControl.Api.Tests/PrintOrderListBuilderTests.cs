using Schulz.DoenerControl.Application.Calculators;
using Schulz.DoenerControl.Application.OrderDays;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests;

// Pure-logic tests for the Abholer's order sheet: lines sorted into article-type order (menu
// SortOrder, then product label, then description, then person), numbered 1..N in that order.
public sealed class PrintOrderListBuilderTests
{
    private static readonly PrintLineBuild NoBuild = new(null, [], string.Empty, false);

    private static PrintLineInput Line(
        int sortOrder,
        string person,
        string product,
        string description,
        int quantity = 1,
        int lineTotalCents = 500,
        bool isPickup = false
    ) =>
        new(
            sortOrder,
            product,
            person,
            product,
            description,
            quantity,
            lineTotalCents,
            isPickup,
            ProductIcon: null,
            NoBuild
        );

    [Fact]
    public void Should_Order_By_Article_Type_Then_Label_Then_Description_Then_Person()
    {
        var result = PrintOrderListBuilder.Build([
            Line(3, "Tom", "Pizza Salami", "Standard"),
            Line(2, "Bob", "Dürüm Kalb", "Scharf"),
            Line(1, "Eva", "Döner Kalb", "Kräuter"),
            Line(1, "Alice", "Döner Kalb", "Kräuter"),
        ]);

        Assert.Equal(
            new[] { "Alice", "Eva", "Bob", "Tom" },
            result.Lines.Select(line => line.PersonName)
        );
        Assert.Equal(new[] { 1, 2, 3, 4 }, result.Lines.Select(line => line.Number));
    }

    [Fact]
    public void Should_Carry_Quantity_On_The_Package_Line()
    {
        var result = PrintOrderListBuilder.Build([
            Line(1, "Bob", "Döner Kalb", "Kräuter", quantity: 3),
        ]);

        var line = Assert.Single(result.Lines);
        Assert.Equal(3, line.Quantity);
    }

    [Fact]
    public void Should_Carry_Icon_And_Doener_Build_When_Numbering()
    {
        var build = new PrintLineBuild("kalb", ["knoblauch", "scharf"], "ohne Zwiebeln", true);
        var input = Line(1, "Bob", "Döner", "Kalb · Knoblauch") with
        {
            ProductIcon = "kebab_dining",
            Build = build,
        };

        var line = Assert.Single(PrintOrderListBuilder.Build([input]).Lines);

        Assert.Equal("kebab_dining", line.ProductIcon);
        Assert.Same(build, line.Build);
        Assert.Equal("Kalb · Knoblauch", line.Description);
    }

    [Fact]
    public void Should_Return_Empty_Sheet_When_No_Lines()
    {
        var result = PrintOrderListBuilder.Build([]);

        Assert.Empty(result.Lines);
    }
}
