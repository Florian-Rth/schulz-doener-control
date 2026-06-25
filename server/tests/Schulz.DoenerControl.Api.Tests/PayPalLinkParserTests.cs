using Schulz.DoenerControl.Application.Calculators;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests;

// Pure-logic unit tests for the PayPal LINK parser. The user only ever enters a link; the parser
// reads the bare handle out of it (stored internally) and rejects anything that is not a real,
// https PayPal link carrying a valid handle.
public sealed class PayPalLinkParserTests
{
    [Fact]
    public void Should_Extract_Handle_When_PayPalMe_Link()
    {
        Assert.True(PayPalLinkParser.TryParseHandle("https://paypal.me/X", out var handle));
        Assert.Equal("X", handle);
    }

    [Fact]
    public void Should_Extract_Handle_When_WwwPayPalMe_Link()
    {
        Assert.True(PayPalLinkParser.TryParseHandle("https://www.paypal.me/X", out var handle));
        Assert.Equal("X", handle);
    }

    [Fact]
    public void Should_Extract_Handle_When_PayPalCom_PayPalMe_Link()
    {
        Assert.True(
            PayPalLinkParser.TryParseHandle("https://paypal.com/paypalme/X", out var handle)
        );
        Assert.Equal("X", handle);
    }

    [Fact]
    public void Should_Extract_Handle_When_WwwPayPalCom_PayPalMe_Link()
    {
        Assert.True(
            PayPalLinkParser.TryParseHandle("https://www.paypal.com/paypalme/X", out var handle)
        );
        Assert.Equal("X", handle);
    }

    [Fact]
    public void Should_Ignore_Trailing_Slash()
    {
        Assert.True(PayPalLinkParser.TryParseHandle("https://paypal.me/X/", out var handle));
        Assert.Equal("X", handle);
    }

    [Fact]
    public void Should_Ignore_Query_And_Fragment()
    {
        Assert.True(
            PayPalLinkParser.TryParseHandle("https://paypal.me/X?utm=qr#section", out var handle)
        );
        Assert.Equal("X", handle);
    }

    [Fact]
    public void Should_Lowercase_Match_The_Host_Casing()
    {
        Assert.True(PayPalLinkParser.TryParseHandle("https://PayPal.Me/X", out var handle));
        Assert.Equal("X", handle);
    }

    [Fact]
    public void Should_Reject_When_Value_Is_A_Bare_Handle()
    {
        Assert.False(PayPalLinkParser.TryParseHandle("X", out var handle));
        Assert.Equal(string.Empty, handle);
    }

    [Fact]
    public void Should_Reject_When_Scheme_Is_Http()
    {
        Assert.False(PayPalLinkParser.TryParseHandle("http://paypal.me/X", out _));
    }

    [Fact]
    public void Should_Reject_When_Host_Is_Not_PayPal()
    {
        Assert.False(PayPalLinkParser.TryParseHandle("https://evil.example.com/X", out _));
    }

    [Fact]
    public void Should_Reject_When_PayPalCom_Path_Is_Not_PayPalMe()
    {
        Assert.False(
            PayPalLinkParser.TryParseHandle("https://www.paypal.com/myaccount/profile", out _)
        );
    }

    [Fact]
    public void Should_Reject_When_PayPalMe_Link_Has_No_Handle()
    {
        Assert.False(PayPalLinkParser.TryParseHandle("https://paypal.me/", out _));
    }

    [Fact]
    public void Should_Reject_When_Handle_Has_Invalid_Characters()
    {
        Assert.False(PayPalLinkParser.TryParseHandle("https://paypal.me/Markus-Wagner", out _));
    }

    [Fact]
    public void Should_Reject_When_Handle_Too_Long()
    {
        var tooLong = "https://paypal.me/" + new string('a', 41);
        Assert.False(PayPalLinkParser.TryParseHandle(tooLong, out _));
    }

    [Fact]
    public void Should_Return_False_When_Value_Null()
    {
        Assert.False(PayPalLinkParser.TryParseHandle(null, out _));
    }

    [Fact]
    public void Should_Return_False_When_Value_Blank()
    {
        Assert.False(PayPalLinkParser.TryParseHandle("   ", out _));
    }
}
