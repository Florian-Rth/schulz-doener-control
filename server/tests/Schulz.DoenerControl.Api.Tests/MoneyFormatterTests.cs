using Schulz.DoenerControl.Application.Calculators;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests;

// Pure-logic unit tests for the cents<->German money string conversion. German formatting uses
// a comma decimal separator and a trailing " €" (matches the mock's eur() helper).
public sealed class MoneyFormatterTests
{
    [Fact]
    public void Should_Format_Fractional_Euro_With_Comma_When_Eight_Fifty()
    {
        Assert.Equal("8,50 €", MoneyFormatter.ToGermanString(850));
    }

    [Fact]
    public void Should_Format_Whole_Euro_With_Two_Decimals_When_Seven_Hundred_Fifty()
    {
        Assert.Equal("7,50 €", MoneyFormatter.ToGermanString(750));
    }

    [Fact]
    public void Should_Format_Whole_Ten_Euro_When_Thousand_Cents()
    {
        Assert.Equal("10,00 €", MoneyFormatter.ToGermanString(1000));
    }

    [Fact]
    public void Should_Format_Thousands_With_Grouping_Separator()
    {
        Assert.Equal("1.234,56 €", MoneyFormatter.ToGermanString(123456));
    }

    [Fact]
    public void Should_Format_Zero_When_No_Cents()
    {
        Assert.Equal("0,00 €", MoneyFormatter.ToGermanString(0));
    }

    [Fact]
    public void Should_Parse_German_String_Back_To_Cents()
    {
        Assert.Equal(850, MoneyFormatter.ParseGermanString("8,50 €"));
    }

    [Fact]
    public void Should_Parse_German_String_Without_Currency_Suffix()
    {
        Assert.Equal(750, MoneyFormatter.ParseGermanString("7,50"));
    }

    [Fact]
    public void Should_Parse_German_Whole_Euro_String()
    {
        Assert.Equal(900, MoneyFormatter.ParseGermanString("9"));
    }

    [Fact]
    public void Should_Return_Null_When_Parsing_Invalid_String()
    {
        Assert.Null(MoneyFormatter.ParseGermanString("keine Zahl"));
    }
}
