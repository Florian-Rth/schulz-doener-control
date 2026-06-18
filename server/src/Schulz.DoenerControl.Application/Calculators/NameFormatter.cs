using System.Diagnostics.Contracts;

namespace Schulz.DoenerControl.Application.Calculators;

// Derives avatar initials and the greeting first name from a display name. Ports the mock's
// initialsOf: first letter of each whitespace-separated word, first two of those, uppercased.
public static class NameFormatter
{
    private static readonly char[] Whitespace = [' ', '\t', '\n', '\r'];

    [Pure]
    public static string InitialsOf(string displayName)
    {
        var words = Split(displayName);
        if (words.Length == 0)
            return string.Empty;

        var initials = words.Take(2).Select(w => w[0]);
        return string.Concat(initials).ToUpperInvariant();
    }

    [Pure]
    public static string FirstNameOf(string displayName)
    {
        var words = Split(displayName);
        return words.Length == 0 ? string.Empty : words[0];
    }

    [Pure]
    private static string[] Split(string displayName) =>
        displayName.Split(Whitespace, StringSplitOptions.RemoveEmptyEntries);
}
