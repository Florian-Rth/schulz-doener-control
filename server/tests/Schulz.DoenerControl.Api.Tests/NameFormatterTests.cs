using Schulz.DoenerControl.Application.Calculators;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests;

// Pure-logic unit tests for deriving initials and first name from a display name (mock initialsOf:
// first letter of up to the first two whitespace-separated words, uppercased).
public sealed class NameFormatterTests
{
    [Fact]
    public void Should_Derive_Two_Letter_Initials_When_First_And_Last_Name()
    {
        Assert.Equal("MW", NameFormatter.InitialsOf("Markus Wagner"));
    }

    [Fact]
    public void Should_Derive_Initials_From_First_Two_Words_When_Three_Words()
    {
        Assert.Equal("LB", NameFormatter.InitialsOf("Lukas Brandt Berger"));
    }

    [Fact]
    public void Should_Derive_Single_Letter_When_One_Word()
    {
        Assert.Equal("S", NameFormatter.InitialsOf("Sara"));
    }

    [Fact]
    public void Should_Uppercase_Initials_When_Lowercase_Name()
    {
        Assert.Equal("TK", NameFormatter.InitialsOf("tobias klein"));
    }

    [Fact]
    public void Should_Collapse_Extra_Whitespace_When_Deriving_Initials()
    {
        Assert.Equal("MW", NameFormatter.InitialsOf("  Markus   Wagner  "));
    }

    [Fact]
    public void Should_Preserve_Non_Ascii_Initial_When_Turkish_Name()
    {
        Assert.Equal("SY", NameFormatter.InitialsOf("Sara Yılmaz"));
    }

    [Fact]
    public void Should_Return_First_Word_When_Deriving_First_Name()
    {
        Assert.Equal("Markus", NameFormatter.FirstNameOf("Markus Wagner"));
    }

    [Fact]
    public void Should_Return_Whole_Name_When_Single_Word_First_Name()
    {
        Assert.Equal("Sara", NameFormatter.FirstNameOf("Sara"));
    }

    [Fact]
    public void Should_Trim_And_Collapse_When_Deriving_First_Name()
    {
        Assert.Equal("Tobias", NameFormatter.FirstNameOf("  Tobias   Klein "));
    }
}
