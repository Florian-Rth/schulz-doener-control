using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Schulz.DoenerControl.Application.Security;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Infrastructure.Persistence.Seeding;

// Idempotent runtime seed for the single bootstrap administrator and the menu reference rows. Runs
// at startup after migrations. The admin password cannot use EF HasData (it needs runtime Argon2id
// hashing with a per-user salt and the configured pepper); the menu is seeded at runtime so its rows
// are ordinary editable data rather than migration-managed. Both seeds are idempotent.
//
// Exactly one admin is created: if any user with Role==Admin already exists, that part is a no-op.
// The admin is provisioned with MustChangePassword=true so the throwaway bootstrap password must be
// changed on first login. Every other account is created later by the admin via the API.
public sealed class DatabaseSeeder
{
    private readonly AppDbContext database;
    private readonly IPasswordHasher passwordHasher;
    private readonly AdminSeedOptions options;
    private readonly TimeProvider timeProvider;
    private readonly MenuSeeder menuSeeder;
    private readonly NotificationTemplateSeeder notificationTemplateSeeder;

    public DatabaseSeeder(
        AppDbContext database,
        IPasswordHasher passwordHasher,
        IOptions<AdminSeedOptions> options,
        TimeProvider timeProvider,
        MenuSeeder menuSeeder,
        NotificationTemplateSeeder notificationTemplateSeeder
    )
    {
        this.database = database;
        this.passwordHasher = passwordHasher;
        this.options = options.Value;
        this.timeProvider = timeProvider;
        this.menuSeeder = menuSeeder;
        this.notificationTemplateSeeder = notificationTemplateSeeder;
    }

    public async Task SeedAsync(CancellationToken ct)
    {
        await menuSeeder.SeedAsync(ct);
        await notificationTemplateSeeder.SeedAsync(ct);

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
