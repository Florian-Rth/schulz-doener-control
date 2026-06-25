using Schulz.DoenerControl.Application.Calculators;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests;

// Pure-logic unit tests for the PayPal LINK builder. It reconstructs the user-facing link from the
// stored handle: a base paypal.me/{handle} link, or the original amount-suffixed
// paypal.me/{handle}/{amount}EUR form when a payment amount is supplied.
public sealed class PayPalLinkBuilderTests
{
    [Fact]
    public void Should_Build_Base_Link_When_No_Amount()
    {
        Assert.Equal("https://paypal.me/MarkusW", PayPalLinkBuilder.BuildLink("MarkusW", null));
    }

    [Fact]
    public void Should_Build_Amount_Suffixed_Link_When_Amount_Supplied()
    {
        Assert.Equal(
            "https://paypal.me/MarkusW/8.00EUR",
            PayPalLinkBuilder.BuildLink("MarkusW", 800)
        );
    }

    [Fact]
    public void Should_Format_Amount_With_Two_Decimals_And_Dot_Separator()
    {
        Assert.Equal(
            "https://paypal.me/MarkusW/7.50EUR",
            PayPalLinkBuilder.BuildLink("MarkusW", 750)
        );
    }

    [Fact]
    public void Should_Trim_The_Handle()
    {
        Assert.Equal("https://paypal.me/MarkusW", PayPalLinkBuilder.BuildLink("  MarkusW  ", null));
    }

    [Fact]
    public void Should_Return_Null_When_Handle_Missing()
    {
        Assert.Null(PayPalLinkBuilder.BuildLink(null, null));
        Assert.Null(PayPalLinkBuilder.BuildLink(null, 800));
    }

    [Fact]
    public void Should_Return_Null_When_Handle_Blank()
    {
        Assert.Null(PayPalLinkBuilder.BuildLink("   ", 800));
    }

    [Fact]
    public void Should_Format_Amount_As_Two_Decimals()
    {
        Assert.Equal("8.00", PayPalLinkBuilder.FormatAmount(800));
        Assert.Equal("0.05", PayPalLinkBuilder.FormatAmount(5));
    }
}
