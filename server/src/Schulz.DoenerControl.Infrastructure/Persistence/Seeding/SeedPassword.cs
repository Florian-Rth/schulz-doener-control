using System.Security.Cryptography;
using Konscious.Security.Cryptography;

namespace Schulz.DoenerControl.Infrastructure.Persistence.Seeding;

// Produces a real Argon2id hash + per-user salt for seeded accounts. The configured pepper
// is mixed in as the Argon2id KnownSecret, exactly as the auth feature verifies later, so a
// DB-only breach (hashes + salts, pepper absent) cannot be cracked offline.
internal static class SeedPassword
{
    private const int SaltLength = 16;
    private const int HashLength = 32;

    public static (byte[] Hash, byte[] Salt) Create(
        string password,
        byte[] pepper,
        int memorySize,
        int iterations
    )
    {
        var salt = RandomNumberGenerator.GetBytes(SaltLength);
        var hash = Compute(password, salt, pepper, memorySize, iterations);
        return (hash, salt);
    }

    private static byte[] Compute(
        string password,
        byte[] salt,
        byte[] pepper,
        int memorySize,
        int iterations
    )
    {
        using var argon2 = new Argon2id(System.Text.Encoding.UTF8.GetBytes(password))
        {
            Salt = salt,
            KnownSecret = pepper,
            MemorySize = memorySize,
            Iterations = iterations,
            DegreeOfParallelism = 1,
        };

        return argon2.GetBytes(HashLength);
    }
}
