using System.Diagnostics.Contracts;
using System.Security.Cryptography;
using System.Text;
using Konscious.Security.Cryptography;
using Microsoft.Extensions.Options;
using Schulz.DoenerControl.Application.Security;

namespace Schulz.DoenerControl.Infrastructure.Security;

// Argon2id password hasher. Each hash uses a fresh 16-byte random salt; the configured pepper is
// supplied as the Argon2id KnownSecret (the keyed-hash "secret" input), so a database-only breach
// — hashes and salts but no pepper — cannot be cracked offline at all. Hashing is one-way: there
// is no path back to the plaintext. This mirrors the scheme used by the startup user seeder so
// seeded credentials verify through this same component.
public sealed class Argon2idPasswordHasher : IPasswordHasher
{
    private const int SaltLength = 16;
    private const int HashLength = 32;
    private const int DegreeOfParallelism = 1;

    private readonly byte[] pepper;
    private readonly int memorySize;
    private readonly int iterations;

    public Argon2idPasswordHasher(IOptions<PasswordHashingOptions> options)
    {
        var value = options.Value;
        pepper = DecodePepper(value.Pepper);
        memorySize = value.MemorySize;
        iterations = value.Iterations;
    }

    public PasswordHash Hash(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(SaltLength);
        var hash = Compute(password, salt);
        return new PasswordHash(hash, salt);
    }

    public bool Verify(string password, byte[] hash, byte[] salt)
    {
        var candidate = Compute(password, salt);
        return CryptographicOperations.FixedTimeEquals(candidate, hash);
    }

    [Pure]
    private static byte[] DecodePepper(string configured)
    {
        if (string.IsNullOrWhiteSpace(configured))
        {
            throw new InvalidOperationException(
                $"'{PasswordHashingOptions.PepperConfigKey}' is not configured; the password "
                    + "hasher cannot run without a server-side pepper."
            );
        }

        var decoded = Convert.FromBase64String(configured);
        if (decoded.Length < PasswordHashingOptions.MinimumPepperBytes)
        {
            throw new InvalidOperationException(
                $"'{PasswordHashingOptions.PepperConfigKey}' must decode to at least "
                    + $"{PasswordHashingOptions.MinimumPepperBytes} bytes."
            );
        }

        return decoded;
    }

    [Pure]
    private byte[] Compute(string password, byte[] salt)
    {
        using var argon2 = new Argon2id(Encoding.UTF8.GetBytes(password))
        {
            Salt = salt,
            KnownSecret = pepper,
            MemorySize = memorySize,
            Iterations = iterations,
            DegreeOfParallelism = DegreeOfParallelism,
        };

        return argon2.GetBytes(HashLength);
    }
}
