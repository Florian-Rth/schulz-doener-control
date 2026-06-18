using Schulz.DoenerControl.Application.Calculators;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests;

// Pure-logic unit tests for the open-day push text builder. The mock renders
// "Heute wird ein {synonym} organisiert!" with a Döner emoji; the body builder is the
// notification sentence using the day's stored synonym.
public sealed class PushTextBuilderTests
{
    [Fact]
    public void Should_Build_Push_Body_When_Synonym_Given()
    {
        var text = PushTextBuilder.BuildOpenDayBody("Drehspieß-Tasche");

        Assert.Equal("Heute wird ein Drehspieß-Tasche organisiert! 🌯", text);
    }

    [Fact]
    public void Should_Embed_Any_Synonym_When_Different_Synonym()
    {
        var text = PushTextBuilder.BuildOpenDayBody("Osmanischer Fleischeimer");

        Assert.Equal("Heute wird ein Osmanischer Fleischeimer organisiert! 🌯", text);
    }

    [Fact]
    public void Should_Expose_All_Eight_Synonyms_From_The_Mock()
    {
        var synonyms = PushTextBuilder.Synonyms;

        Assert.Equal(8, synonyms.Count);
        Assert.Contains("Drehspieß-Tasche", synonyms);
        Assert.Contains("Osmanischer Fleischeimer", synonyms);
        Assert.Contains("Klappkatze", synonyms);
    }

    [Fact]
    public void Should_Build_Dashboard_Preview_With_Synonym_And_Cutoff()
    {
        var preview = PushTextBuilder.BuildOpenDayPreview("Klappkatze", "11:30 Uhr");

        Assert.Equal(
            "Achtung Kollegen — heute wird ein „Klappkatze\" organisiert! "
                + "Bestellschluss 11:30 Uhr. Wer ist dabei?",
            preview
        );
    }
}
