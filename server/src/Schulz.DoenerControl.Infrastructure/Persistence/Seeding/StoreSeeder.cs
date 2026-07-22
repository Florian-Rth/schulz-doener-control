using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Schulz.DoenerControl.Core.Entities;

namespace Schulz.DoenerControl.Infrastructure.Persistence.Seeding;

// Idempotent runtime seed for the single bootstrap store. Runs at startup after migrations, ahead of
// the menu seed which scopes its rows to this store. Upsert-by-key (decision #8): the canonical store
// is inserted when its stable Key is missing and otherwise left untouched, so an admin who renamed or
// reordered it is never overwritten. A store must always exist, so — unlike the menu/template seeds —
// this is keyed rather than all-or-nothing on emptiness.
public sealed class StoreSeeder
{
    public const string CanonicalStoreKey = "schulz-doener";

    // Fixed id for the bootstrap store so the AddStore migration (which inserts the row and backfills
    // legacy OrderDays onto it) and this runtime seeder resolve to the exact same store. Never change.
    public static readonly Guid CanonicalStoreId = new("11111111-1111-4111-8111-111111111111");

    private readonly AppDbContext database;
    private readonly TimeProvider timeProvider;

    public StoreSeeder(AppDbContext database, TimeProvider timeProvider)
    {
        this.database = database;
        this.timeProvider = timeProvider;
    }

    public async Task SeedAsync(CancellationToken ct)
    {
        if (await database.Stores.AnyAsync(store => store.Key == CanonicalStoreKey, ct))
        {
            return;
        }

        database.Stores.Add(
            new Store
            {
                Id = CanonicalStoreId,
                Key = CanonicalStoreKey,
                Name = "Schulz Döner",
                SortOrder = 0,
                IsActive = true,
                CreatedAt = timeProvider.GetUtcNow(),
            }
        );

        try
        {
            await database.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            // A concurrently-started host already seeded the store. Discard our pending insert.
            database.ChangeTracker.Clear();
        }
    }

    private static bool IsUniqueViolation(DbUpdateException ex) =>
        ex.InnerException is SqliteException { SqliteErrorCode: 19 };
}
