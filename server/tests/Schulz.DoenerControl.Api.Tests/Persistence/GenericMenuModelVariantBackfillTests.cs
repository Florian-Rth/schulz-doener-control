using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Schulz.DoenerControl.Infrastructure.Persistence;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests.Persistence;

// The GenericMenuModel migration must carry every pizza variant — canonical AND admin-added — into
// the `variant` field's options and backfill each order line onto them. Production held admin-added
// variants referenced by real orders; the first version of the migration mapped only the five
// canonical ids, tripped its VERIFY guard and left the API crash-looping on startup.
public sealed class GenericMenuModelVariantBackfillTests
{
    private const string PreviousMigration = "20260723084042_AddStore";

    private const string FunghiId = "B1A7C0DE-0003-4A03-9A03-000000000003";
    private const string PeperoniId = "7A1D5E00-1272-4321-8E81-938286F97BEE";

    private static CancellationToken Ct => TestContext.Current.CancellationToken;

    [Fact]
    public async Task Should_Map_Canonical_And_Admin_Added_Variants_When_Generic_Menu_Migration_Applied()
    {
        var connectionString = new SqliteConnectionStringBuilder
        {
            DataSource = $"variant-backfill-test-{Guid.NewGuid():N}.db",
            Mode = SqliteOpenMode.Memory,
            Cache = SqliteCacheMode.Shared,
        }.ToString();

        await using var keepAlive = new SqliteConnection(connectionString);
        await keepAlive.OpenAsync(Ct);

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(connectionString)
            .Options;

        var funghiLineId = Guid.NewGuid().ToString().ToUpperInvariant();
        var peperoniLineId = Guid.NewGuid().ToString().ToUpperInvariant();

        await using (var database = new AppDbContext(options))
        {
            var migrator = database.GetService<IMigrator>();
            await migrator.MigrateAsync(PreviousMigration, Ct);
            await SeedPizzaOrderAsync(database, funghiLineId, peperoniLineId);
            await migrator.MigrateAsync(targetMigration: null, Ct);
        }

        await using (var database = new AppDbContext(options))
        {
            var lines = await database
                .OrderLines.AsNoTracking()
                .ToDictionaryAsync(line => line.Id.ToString().ToUpperInvariant(), Ct);
            Assert.Equal(["funghi"], lines[funghiLineId].Answers.OptionsFor("variant"));
            Assert.Equal(
                [$"v-{PeperoniId.ToLowerInvariant()}"],
                lines[peperoniLineId].Answers.OptionsFor("variant")
            );

            var variantOptions = await database
                .FieldOptions.AsNoTracking()
                .Where(option => option.FieldDefinition!.Key == "variant")
                .OrderBy(option => option.SortOrder)
                .Select(option => new
                {
                    option.Key,
                    option.Label,
                    option.PriceDeltaCents,
                })
                .ToListAsync(Ct);
            Assert.Equal(
                [
                    "margherita",
                    "funghi",
                    "salami",
                    "tonno",
                    "hawaii",
                    $"v-{PeperoniId.ToLowerInvariant()}",
                ],
                variantOptions.Select(option => option.Key).ToArray()
            );
            Assert.Equal("Peperoni", variantOptions[^1].Label);
            Assert.Equal(
                100,
                variantOptions.Single(option => option.Key == "salami").PriceDeltaCents
            );
        }
    }

    private static async Task SeedPizzaOrderAsync(
        AppDbContext database,
        string funghiLineId,
        string peperoniLineId
    )
    {
        var userId = Guid.NewGuid().ToString().ToUpperInvariant();
        var dayId = Guid.NewGuid().ToString().ToUpperInvariant();
        var orderId = Guid.NewGuid().ToString().ToUpperInvariant();
        var now = DateTimeOffset.UtcNow.ToString("o");

        // Ids are written as upper-case text, exactly as EF's SQLite provider stored them in prod.
        await database.Database.ExecuteSqlInterpolatedAsync(
            $@"
            INSERT INTO ""MenuItems"" (""Id"",""Name"",""DefaultPriceCents"",""Kind"",""MaterialIcon"",""Note"",""IsInsider"",""SortOrder"",""IsAvailable"")
            VALUES ('pizza','Pizza',1000,2,'local_pizza',NULL,0,6,1);
            INSERT INTO ""PizzaVariants"" (""Id"",""Name"",""Icon"",""SortOrder"",""IsAvailable"")
            VALUES ({PeperoniId},'Peperoni',NULL,0,1);
            INSERT INTO ""Users"" (""Id"",""Username"",""NormalizedUserName"",""DisplayName"",""PayPalHandle"",""PasswordHash"",""PasswordSalt"",""Role"",""IsActive"",""MustChangePassword"",""AvatarColorHex"",""CreatedAt"")
            VALUES ({userId},'tester','tester','Tester',NULL,X'01',X'01',1,1,0,'#000000',{now});
            INSERT INTO ""OrderDays"" (""Id"",""Date"",""Status"",""Synonym"",""OrderCutoffAt"",""OpenedByUserId"",""OpenedAt"",""ClosedAt"",""CollectorUserId"")
            VALUES ({dayId},'2026-01-01',1,'Drehspieß-Tasche',{now},{userId},{now},NULL,NULL);
            INSERT INTO ""Orders"" (""Id"",""OrderDayId"",""UserId"",""IsPickup"",""OccurredOn"",""CreatedAt"",""UpdatedAt"")
            VALUES ({orderId},{dayId},{userId},0,{now},{now},{now});
            INSERT INTO ""OrderLines"" (""Id"",""OrderId"",""ProductId"",""Kind"",""Meat"",""PizzaVariantId"",""Sauces"",""PriceCents"",""Extra"",""Quantity"")
            VALUES ({funghiLineId},{orderId},'pizza',2,NULL,{FunghiId},0,1000,NULL,1),
                   ({peperoniLineId},{orderId},'pizza',2,NULL,{PeperoniId},0,1000,NULL,1);",
            Ct
        );
    }
}
