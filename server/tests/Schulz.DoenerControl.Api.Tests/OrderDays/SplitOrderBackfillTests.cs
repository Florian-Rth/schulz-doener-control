using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Schulz.DoenerControl.Core.Enums;
using Schulz.DoenerControl.Infrastructure.Persistence;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.OrderDays;

// Focused test for the SplitOrderIntoHeaderAndLines migration's backfill: migrate a fresh database
// up to the migration BEFORE the split, raw-insert an old-shape single-row Order (per-item columns
// on Orders), then apply the split migration and assert exactly one OrderLine was created with the
// copied fields and Quantity = 1. Runs on its own connection so it controls the migration target,
// independent of the harness fixture (which always migrates to latest).
public sealed class SplitOrderBackfillTests
{
    private const string PreviousMigration = "20260619072314_AddMenuItemIsAvailableAndDropMenuSeed";
    private const string SplitMigration = "20260619112847_SplitOrderIntoHeaderAndLines";

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Should_Backfill_One_OrderLine_Per_Order_When_Split_Migration_Applied()
    {
        var connectionString = new SqliteConnectionStringBuilder
        {
            DataSource = $"backfill-test-{Guid.NewGuid():N}.db",
            Mode = SqliteOpenMode.Memory,
            Cache = SqliteCacheMode.Shared,
        }.ToString();

        // Keep-alive connection keeps the shared in-memory database alive for the test lifetime.
        await using var keepAlive = new SqliteConnection(connectionString);
        await keepAlive.OpenAsync(Ct);

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(connectionString)
            .Options;

        await using (var database = new AppDbContext(options))
        {
            var migrator = database.GetService<IMigrator>();

            // Migrate to the schema BEFORE the split (Orders still carries the per-item columns).
            await migrator.MigrateAsync(PreviousMigration, Ct);

            var orderId = Guid.NewGuid();
            await SeedOldShapeOrderAsync(database, orderId);

            // Apply the split: the backfill INSERT...SELECT must fire before the column-drop rebuild.
            await migrator.MigrateAsync(SplitMigration, Ct);
        }

        await using (var database = new AppDbContext(options))
        {
            var lines = await database
                .OrderLines.AsNoTracking()
                .Include(line => line.Order)
                .ToListAsync(Ct);

            var line = Assert.Single(lines);
            Assert.Equal(1, line.Quantity);
            Assert.NotEqual(Guid.Empty, line.Id);
            Assert.Equal("doener", line.ProductId);
            Assert.Equal(ProductKind.Doener, line.Kind);
            Assert.Equal(MeatType.Kalb, line.Meat);
            Assert.Null(line.PizzaVariant);
            Assert.Equal(Sauce.Knoblauch | Sauce.Scharf, line.Sauces);
            Assert.Equal(750, line.PriceCents);
            Assert.Equal("ohne Zwiebeln", line.Extra);

            // The header survives with no per-item state and its total derives from the one line.
            Assert.NotNull(line.Order);
            Assert.Equal(750, line.Order!.TotalCents);
        }
    }

    private static async Task SeedOldShapeOrderAsync(AppDbContext database, Guid orderId)
    {
        var userId = Guid.NewGuid();
        var dayId = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow.ToString("o");

        // Raw inserts against the pre-split schema: a MenuItem and User (Order FKs), an OrderDay, then
        // the old single-row Order with its per-item columns populated. ExecuteSqlInterpolatedAsync
        // parameterizes the interpolation holes (no SQL-injection warning).
        await database.Database.ExecuteSqlInterpolatedAsync(
            $@"
            INSERT INTO ""MenuItems"" (""Id"",""Name"",""DefaultPriceCents"",""Kind"",""MaterialIcon"",""Note"",""IsInsider"",""SortOrder"",""IsAvailable"")
            VALUES ('doener','Döner',750,1,'kebab_dining',NULL,0,0,1);",
            Ct
        );

        await database.Database.ExecuteSqlInterpolatedAsync(
            $@"
            INSERT INTO ""Users"" (""Id"",""Username"",""NormalizedUserName"",""DisplayName"",""PayPalHandle"",""PasswordHash"",""PasswordSalt"",""Role"",""IsActive"",""MustChangePassword"",""AvatarColorHex"",""CreatedAt"")
            VALUES ({userId}, 'tester', 'tester', 'Tester', NULL, X'01', X'01', 1, 1, 0, '#000000', {now});",
            Ct
        );

        await database.Database.ExecuteSqlInterpolatedAsync(
            $@"
            INSERT INTO ""OrderDays"" (""Id"",""Date"",""Status"",""Synonym"",""OrderCutoffAt"",""OpenedByUserId"",""OpenedAt"",""ClosedAt"",""CollectorUserId"")
            VALUES ({dayId}, '2026-01-01', 1, 'Drehspieß-Tasche', {now}, {userId}, {now}, NULL, NULL);",
            Ct
        );

        await database.Database.ExecuteSqlInterpolatedAsync(
            $@"
            INSERT INTO ""Orders"" (""Id"",""OrderDayId"",""UserId"",""ProductId"",""Kind"",""Meat"",""PizzaVariant"",""Sauces"",""PriceCents"",""Extra"",""IsPickup"",""OccurredOn"",""CreatedAt"",""UpdatedAt"")
            VALUES ({orderId}, {dayId}, {userId}, 'doener', 1, 1, NULL, 6, 750, 'ohne Zwiebeln', 0, {now}, {now}, {now});",
            Ct
        );
    }
}
