using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Schulz.DoenerControl.Application.Security;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Infrastructure.Persistence.Seeding;

// Idempotent runtime seed for the single bootstrap administrator. Runs at startup after migrations.
// The password cannot use EF HasData (it needs runtime Argon2id hashing with a per-user salt and the
// configured pepper), so it is seeded here rather than in the migration. The 6 MenuItem reference
// rows are seeded via HasData in the migration itself.
//
// Exactly one admin is created: if any user with Role==Admin already exists, this is a no-op. The
// admin is provisioned with MustChangePassword=true so the throwaway bootstrap password must be
// changed on first login. Every other account is created later by the admin via the API.
public sealed class DatabaseSeeder
{
    private readonly AppDbContext database;
    private readonly IPasswordHasher passwordHasher;
    private readonly AdminSeedOptions options;
    private readonly TimeProvider timeProvider;

    public DatabaseSeeder(
        AppDbContext database,
        IPasswordHasher passwordHasher,
        IOptions<AdminSeedOptions> options,
        TimeProvider timeProvider
    )
    {
        this.database = database;
        this.passwordHasher = passwordHasher;
        this.options = options.Value;
        this.timeProvider = timeProvider;
    }

    public async Task SeedAsync(CancellationToken ct)
    {
        if (await database.Users.AnyAsync(user => user.Role == UserRole.Admin, ct))
        {
            return;
        }

        if (string.IsNullOrWhiteSpace(options.Password))
        {
            throw new InvalidOperationException(
                $"'{AdminSeedOptions.ConfigSection}:Password' is not configured; the seeder cannot "
                    + "provision the bootstrap administrator without it."
            );
        }

        var hashed = passwordHasher.Hash(options.Password);

        database.Users.Add(
            new User
            {
                Id = Guid.NewGuid(),
                Username = options.Username,
                NormalizedUserName = options.Username.ToLowerInvariant(),
                DisplayName = options.DisplayName,
                PayPalHandle = null,
                PasswordHash = hashed.Hash,
                PasswordSalt = hashed.Salt,
                Role = UserRole.Admin,
                IsActive = true,
                MustChangePassword = true,
                AvatarColorHex = options.AvatarColorHex,
                CreatedAt = timeProvider.GetUtcNow(),
            }
        );

        try
        {
            await database.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            // A concurrently-started host already seeded the admin. Discard our pending insert and
            // treat as done.
            database.ChangeTracker.Clear();
        }
    }

    private static bool IsUniqueViolation(DbUpdateException ex) =>
        ex.InnerException is SqliteException { SqliteErrorCode: 19 };
}
