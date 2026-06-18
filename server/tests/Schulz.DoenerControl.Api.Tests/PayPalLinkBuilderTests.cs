using Schulz.DoenerControl.Application.Calculators;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests;

// Pure-logic unit tests for the PayPal.Me link builder. The amount is always two decimals with
// a dot separator (paypal.me/{handle}/{amount}EUR), independent of culture.
public sealed class PayPalLinkBuilderTests
{
    [Fact]
    public void Should_Format_Whole_Euro_With_Two_Decimals_When_Eight_Hundred_Cents()
    {
        Assert.Equal("8.00", PayPalLinkBuilder.FormatAmount(800));
    }

    [Fact]
    public void Should_Format_Ten_Euro_With_Two_Decimals_When_Thousand_Cents()
    {
        Assert.Equal("10.00", PayPalLinkBuilder.FormatAmount(1000));
    }

    [Fact]
    public void Should_Format_Fractional_Euro_With_Dot_Separator_When_Eight_Fifty()
    {
        Assert.Equal("8.50", PayPalLinkBuilder.FormatAmount(850));
    }

    [Fact]
    public void Should_Format_Single_Cent_With_Leading_Zeros()
    {
        Assert.Equal("0.05", PayPalLinkBuilder.FormatAmount(5));
    }

    [Fact]
    public void Should_Build_Full_Link_When_Handle_And_Amount_Given()
    {
        var url = PayPalLinkBuilder.BuildLink("LukasBrandtHB", 850);

        Assert.Equal("https://paypal.me/LukasBrandtHB/8.50EUR", url);
    }

    [Fact]
    public void Should_Build_Full_Link_For_Whole_Euro_Amount()
    {
        var url = PayPalLinkBuilder.BuildLink("SaraYHB", 300);

        Assert.Equal("https://paypal.me/SaraYHB/3.00EUR", url);
    }

    [Fact]
    public void Should_Return_Null_When_Handle_Missing()
    {
        Assert.Null(PayPalLinkBuilder.BuildLink(null, 800));
    }

    [Fact]
    public void Should_Return_Null_When_Handle_Blank()
    {
        Assert.Null(PayPalLinkBuilder.BuildLink("   ", 800));
    }
}
