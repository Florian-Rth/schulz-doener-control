using Schulz.DoenerControl.Application.Calculators;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests;

// Pure-logic tests for the Abholer's order sheet: lines sorted into article-type order (menu
// SortOrder, then product label, then description, then person), numbered 1..N in that order, plus
// the grouped "n× …" shop summary that folds identical items together.
public sealed class PrintOrderListBuilderTests
{
    private static PrintLineInput Line(
        int sortOrder,
        string person,
        string product,
        string description,
        int quantity = 1,
        int lineTotalCents = 500,
        bool isPickup = false
    ) => new(sortOrder, product, person, product, description, quantity, lineTotalCents, isPickup);

    [Fact]
    public void Should_Order_By_Article_Type_Then_Label_Then_Description_Then_Person()
    {
        var result = PrintOrderListBuilder.Build(
            [
                Line(3, "Tom", "Pizza Salami", "Standard"),
                Line(2, "Bob", "Dürüm Kalb", "Scharf"),
                Line(1, "Eva", "Döner Kalb", "Kräuter"),
                Line(1, "Alice", "Döner Kalb", "Kräuter"),
            ]
        );

        Assert.Equal(
            new[] { "Alice", "Eva", "Bob", "Tom" },
            result.Lines.Select(line => line.PersonName)
        );
        Assert.Equal(new[] { 1, 2, 3, 4 }, result.Lines.Select(line => line.Number));
    }

    [Fact]
    public void Should_Group_Identical_Items_Into_The_Shop_Summary()
    {
        var result = PrintOrderListBuilder.Build(
            [
                Line(1, "Eva", "Döner Kalb", "Kräuter"),
                Line(1, "Alice", "Döner Kalb", "Kräuter"),
                Line(2, "Bob", "Dürüm Kalb", "Scharf"),
                Line(3, "Tom", "Pizza Salami", "Standard"),
            ]
        );

        Assert.Equal(3, result.Summary.Count);
        Assert.Equal("Döner Kalb · Kräuter", result.Summary[0].Label);
        Assert.Equal(2, result.Summary[0].Quantity);
        Assert.Equal("Dürüm Kalb · Scharf", result.Summary[1].Label);
        Assert.Equal(1, result.Summary[1].Quantity);
        // "Standard" is dropped from the grouped label so a plain item reads just "Pizza Salami".
        Assert.Equal("Pizza Salami", result.Summary[2].Label);
    }

    [Fact]
    public void Should_Count_Quantity_Toward_The_Summary_Not_The_Line_Count()
    {
        var result = PrintOrderListBuilder.Build([Line(1, "Bob", "Döner Kalb", "Kräuter", quantity: 3)]);

        // One numbered package line carrying its quantity...
        var line = Assert.Single(result.Lines);
        Assert.Equal(3, line.Quantity);
        // ...but the shop summary reflects three of that item.
        var group = Assert.Single(result.Summary);
        Assert.Equal(3, group.Quantity);
    }

    [Fact]
    public void Should_Return_Empty_Sheet_When_No_Lines()
    {
        var result = PrintOrderListBuilder.Build([]);

        Assert.Empty(result.Lines);
        Assert.Empty(result.Summary);
    }
}
