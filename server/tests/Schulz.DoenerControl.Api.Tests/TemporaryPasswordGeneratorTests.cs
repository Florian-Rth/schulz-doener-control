using System.Text.RegularExpressions;
using Schulz.DoenerControl.Application.Security;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests;

// Pure-logic tests for the readable one-time password generator: the shape is stable, the alphabet
// avoids ambiguous glyphs, and successive values do not collide (a smoke test for real entropy).
public sealed partial class TemporaryPasswordGeneratorTests
{
    // Five lowercase letters, a dash, four digits.
    [GeneratedRegex("^[a-z]{5}-[0-9]{4}$")]
    private static partial Regex Shape();

    [Fact]
    public void Should_Match_LetterDashDigit_Shape()
    {
        var password = TemporaryPasswordGenerator.Generate();

        Assert.Matches(Shape(), password);
    }

    [Fact]
    public void Should_Avoid_Ambiguous_Characters()
    {
        // Generate many to make the assertion robust against a single lucky draw.
        for (var attempt = 0; attempt < 500; attempt++)
        {
            var password = TemporaryPasswordGenerator.Generate();

            Assert.DoesNotContain('l', password);
            Assert.DoesNotContain('i', password);
            Assert.DoesNotContain('o', password);
            Assert.DoesNotContain('0', password);
            Assert.DoesNotContain('1', password);
        }
    }

    [Fact]
    public void Should_Not_Collide_Across_Many_Generations()
    {
        var generated = new HashSet<string>(StringComparer.Ordinal);

        for (var attempt = 0; attempt < 1000; attempt++)
            generated.Add(TemporaryPasswordGenerator.Generate());

        // With ~23^5 * 8^4 of keyspace, 1000 draws should essentially never collide.
        Assert.True(generated.Count >= 999);
    }
}
