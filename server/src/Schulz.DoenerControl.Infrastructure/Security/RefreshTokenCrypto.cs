using System.Diagnostics.Contracts;
using System.Security.Cryptography;

namespace Schulz.DoenerControl.Infrastructure.Security;

// Opaque refresh-token primitives. The raw token is a 32-byte CSPRNG value rendered base64url and
// returned only in the cookie; the database stores nothing but its SHA-256 hash, so a DB read can
// never reconstruct a usable token. Lookup hashes the presented raw value and matches on the hash.
internal static class RefreshTokenCrypto
{
    private const int TokenBytes = 32;

    [Pure]
    public static string CreateRawToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(TokenBytes);
        return Base64UrlEncode(bytes);
    }

    [Pure]
    public static byte[] Hash(string rawToken)
    {
        var bytes = System.Text.Encoding.UTF8.GetBytes(rawToken);
        return SHA256.HashData(bytes);
    }

    [Pure]
    private static string Base64UrlEncode(byte[] bytes) =>
        Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
}
