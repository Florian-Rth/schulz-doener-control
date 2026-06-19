using System.Diagnostics.Contracts;
using System.Security.Cryptography;

namespace Schulz.DoenerControl.Application.Security;

// Generates a human-readable one-time password the admin can read aloud or paste into a chat when
// provisioning an account. Shape: five letters, a dash, four digits (e.g. "gulto-4821"). The
// alphabets deliberately drop ambiguous glyphs (l/1, o/0, i, etc.) so the temp password survives
// being spoken or transcribed. Every character is drawn from a cryptographically secure RNG, never
// System.Random, so the value cannot be predicted from another generated password.
public static class TemporaryPasswordGenerator
{
    private const int LetterCount = 5;
    private const int DigitCount = 4;

    // No ambiguous letters: i, l, o removed (look like 1/0 or each other).
    private const string Letters = "abcdefghjkmnpqrstuvwxyz";

    // No ambiguous digits: 0 and 1 removed (look like o/l and i).
    private const string Digits = "23456789";

    [Pure]
    public static string Generate()
    {
        Span<char> buffer = stackalloc char[LetterCount + 1 + DigitCount];

        for (var index = 0; index < LetterCount; index++)
            buffer[index] = PickFrom(Letters);

        buffer[LetterCount] = '-';

        for (var index = 0; index < DigitCount; index++)
            buffer[LetterCount + 1 + index] = PickFrom(Digits);

        return new string(buffer);
    }

    [Pure]
    private static char PickFrom(string alphabet) =>
        alphabet[RandomNumberGenerator.GetInt32(alphabet.Length)];
}
