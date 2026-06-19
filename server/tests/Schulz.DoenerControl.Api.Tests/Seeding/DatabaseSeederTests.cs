using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Schulz.DoenerControl.Core.Enums;
using Schulz.DoenerControl.Infrastructure.Persistence;
using Schulz.DoenerControl.Infrastructure.Persistence.Seeding;
using Schulz.DoenerControl.Infrastructure.Security;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Seeding;

// The production bootstrap seeder runs against a real SQLite database: it provisions exactly one
// admin from the configured AdminSeedOptions with MustChangePassword=true, hashes the password
// through the real Argon2id hasher, and is idempotent + safe to run twice.
public sealed class DatabaseSeederTests
{
    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Should_Seed_Single_Admin_With_ForcedPasswordChange_When_NoAdminExists()
    {
        await using var harness = await SeederHarness.CreateAsync();
        var options = new AdminSeedOptions
        {
            Username = "chef",
            Password = "Bootstrap-Pw!2026",
            DisplayName = "Der Chef",
            AvatarColorHex = "#123456",
        };

        await harness.SeedAsync(options);

        var users = await harness.Database.Users.ToListAsync(Ct);
        var admin = Assert.Single(users);
        Assert.Equal("chef", admin.Username);
        Assert.Equal("chef", admin.NormalizedUserName);
        Assert.Equal("Der Chef", admin.DisplayName);
        Assert.Equal("#123456", admin.AvatarColorHex);
        Assert.Equal(UserRole.Admin, admin.Role);
        Assert.True(admin.IsActive);
        Assert.True(admin.MustChangePassword);
        Assert.NotEmpty(admin.PasswordHash);
        Assert.NotEmpty(admin.PasswordSalt);

        // The hash verifies through the real hasher (the seeder used the production hashing path).
        Assert.True(
            harness.Hasher.Verify(options.Password, admin.PasswordHash, admin.PasswordSalt)
        );
    }

    [Fact]
    public async Task Should_BeIdempotent_When_RunTwice()
    {
        await using var harness = await SeederHarness.CreateAsync();
        var options = new AdminSeedOptions { Password = "Bootstrap-Pw!2026" };

        await harness.SeedAsync(options);
        await harness.SeedAsync(options);

        var adminCount = await harness.Database.Users.CountAsync(
            user => user.Role == UserRole.Admin,
            Ct
        );
        Assert.Equal(1, adminCount);
    }

    [Fact]
    public async Task Should_Throw_When_Password_Not_Configured()
    {
        await using var harness = await SeederHarness.CreateAsync();
        var options = new AdminSeedOptions { Password = "" };

        await Assert.ThrowsAsync<InvalidOperationException>(() => harness.SeedAsync(options));
    }

    // A self-contained real-SQLite harness for the seeder: an in-memory database with the real schema
    // applied, plus the real Argon2id hasher wired with the weak test profile.
    private sealed class SeederHarness : IAsyncDisposable
    {
        private readonly SqliteConnection connection;

        private SeederHarness(SqliteConnection connection, AppDbContext database)
        {
            this.connection = connection;
            Database = database;
            Hasher = new Argon2idPasswordHasher(
                Options.Create(
                    new PasswordHashingOptions
                    {
                        Pepper = TestConfig.Pepper,
                        MemorySize = int.Parse(TestConfig.PasswordHashingMemorySize),
                        Iterations = int.Parse(TestConfig.PasswordHashingIterations),
                    }
                )
            );
        }

        public AppDbContext Database { get; }

        public Argon2idPasswordHasher Hasher { get; }

        public static async Task<SeederHarness> CreateAsync()
        {
            var connection = new SqliteConnection("DataSource=:memory:");
            await connection.OpenAsync(Ct);

            var options = new DbContextOptionsBuilder<AppDbContext>().UseSqlite(connection).Options;
            var database = new AppDbContext(options);
            await database.Database.MigrateAsync(Ct);

            return new SeederHarness(connection, database);
        }

        public async Task SeedAsync(AdminSeedOptions options)
        {
            var seeder = new DatabaseSeeder(
                Database,
                Hasher,
                Options.Create(options),
                TimeProvider.System
            );
            await seeder.SeedAsync(Ct);
            Database.ChangeTracker.Clear();
        }

        public async ValueTask DisposeAsync()
        {
            await Database.DisposeAsync();
            await connection.DisposeAsync();
        }
    }
}
