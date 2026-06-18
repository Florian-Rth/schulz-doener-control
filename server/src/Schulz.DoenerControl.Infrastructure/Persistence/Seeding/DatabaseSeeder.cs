using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Schulz.DoenerControl.Core.Entities;

namespace Schulz.DoenerControl.Infrastructure.Persistence.Seeding;

// Idempotent runtime seed for the 13 employee accounts. Runs at startup after migrations.
// User passwords cannot use EF HasData (they need runtime Argon2id hashing with a per-user
// salt and the configured pepper), so they are seeded here rather than in the migration.
// The 6 MenuItem reference rows are seeded via HasData in the migration itself.
public sealed class DatabaseSeeder
{
    private const int DefaultMemorySize = 19456;
    private const int DefaultIterations = 2;

    private readonly AppDbContext database;
    private readonly IConfiguration configuration;
    private readonly TimeProvider timeProvider;

    public DatabaseSeeder(
        AppDbContext database,
        IConfiguration configuration,
        TimeProvider timeProvider
    )
    {
        this.database = database;
        this.configuration = configuration;
        this.timeProvider = timeProvider;
    }

    public async Task SeedAsync(CancellationToken ct)
    {
        var existing = await database.Users.Select(user => user.NormalizedUserName).ToListAsync(ct);
        var existingNames = existing.ToHashSet();

        if (existingNames.Count == SeedData.Users.Count)
        {
            return;
        }

        var pepper = ResolvePepper();
        var memorySize = ReadInt("PasswordHashing:MemorySize", DefaultMemorySize);
        var iterations = ReadInt("PasswordHashing:Iterations", DefaultIterations);
        var now = timeProvider.GetUtcNow();

        foreach (var seed in SeedData.Users)
        {
            var normalized = seed.Username.ToLowerInvariant();
            if (existingNames.Contains(normalized))
            {
                continue;
            }

            var password = seed.MustChangePassword
                ? SeedData.InitialPassword
                : SeedData.DevPassword;
            var (hash, salt) = SeedPassword.Create(password, pepper, memorySize, iterations);

            database.Users.Add(
                new User
                {
                    Id = Guid.NewGuid(),
                    Username = seed.Username,
                    NormalizedUserName = normalized,
                    DisplayName = seed.DisplayName,
                    PayPalHandle = seed.PayPalHandle,
                    PasswordHash = hash,
                    PasswordSalt = salt,
                    Role = seed.Role,
                    IsActive = true,
                    MustChangePassword = seed.MustChangePassword,
                    AvatarColorHex = seed.AvatarColorHex,
                    CreatedAt = now,
                }
            );
        }

        try
        {
            await database.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            // A concurrently-started host (the integration-test harness boots several at once)
            // already seeded these accounts. Discard our pending inserts and treat as done.
            database.ChangeTracker.Clear();
        }
    }

    private static bool IsUniqueViolation(DbUpdateException ex) =>
        ex.InnerException is SqliteException { SqliteErrorCode: 19 };

    private byte[] ResolvePepper()
    {
        var configured = configuration["Auth:Pepper"];
        if (string.IsNullOrWhiteSpace(configured))
        {
            throw new InvalidOperationException(
                "Auth:Pepper is not configured; the seeder cannot hash passwords without it."
            );
        }

        return Convert.FromBase64String(configured);
    }

    private int ReadInt(string key, int fallback) =>
        int.TryParse(configuration[key], out var value) ? value : fallback;
}
