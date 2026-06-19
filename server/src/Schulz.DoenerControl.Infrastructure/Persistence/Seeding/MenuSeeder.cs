using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Infrastructure.Persistence.Seeding;

// Idempotent runtime seed for the menu reference rows. The menu used to be planted via EF HasData in
// the migration, which made the rows migration-managed and effectively read-only. Moving the seed
// here turns the 6 canonical items into ordinary editable rows: admins can create, edit and retire
// them through the API, and a fresh database is bootstrapped with the canonical menu exactly once.
//
// Seeding is all-or-nothing on emptiness: if any menu item already exists this is a no-op, so an
// admin who has since edited or deleted items is never overwritten.
public sealed class MenuSeeder
{
    public static readonly IReadOnlyList<MenuItem> CanonicalItems = new[]
    {
        new MenuItem
        {
            Id = "doener",
            Name = "Döner",
            DefaultPriceCents = 750,
            Kind = ProductKind.Doener,
            MaterialIcon = "kebab_dining",
            Note = null,
            IsInsider = false,
            SortOrder = 1,
            IsAvailable = true,
        },
        new MenuItem
        {
            Id = "duerum",
            Name = "Dürüm",
            DefaultPriceCents = 800,
            Kind = ProductKind.Doener,
            MaterialIcon = "wrap_text",
            Note = null,
            IsInsider = false,
            SortOrder = 2,
            IsAvailable = true,
        },
        new MenuItem
        {
            Id = "big",
            Name = "Big Döner",
            DefaultPriceCents = 950,
            Kind = ProductKind.Doener,
            MaterialIcon = "lunch_dining",
            Note = null,
            IsInsider = false,
            SortOrder = 3,
            IsAvailable = true,
        },
        new MenuItem
        {
            Id = "box",
            Name = "Dönerbox",
            DefaultPriceCents = 650,
            Kind = ProductKind.Doener,
            MaterialIcon = "takeout_dining",
            Note = null,
            IsInsider = false,
            SortOrder = 4,
            IsAvailable = true,
        },
        new MenuItem
        {
            Id = "danny",
            Name = "Danny-Box",
            DefaultPriceCents = 600,
            Kind = ProductKind.Doener,
            MaterialIcon = "workspace_premium",
            Note = "Pommes · Fleisch · Soße",
            IsInsider = true,
            SortOrder = 5,
            IsAvailable = true,
        },
        new MenuItem
        {
            Id = "pizza",
            Name = "Pizza",
            DefaultPriceCents = 900,
            Kind = ProductKind.Pizza,
            MaterialIcon = "local_pizza",
            Note = null,
            IsInsider = false,
            SortOrder = 6,
            IsAvailable = true,
        },
    };

    private readonly AppDbContext database;

    public MenuSeeder(AppDbContext database)
    {
        this.database = database;
    }

    public async Task SeedAsync(CancellationToken ct)
    {
        if (await database.MenuItems.AnyAsync(ct))
        {
            return;
        }

        database.MenuItems.AddRange(CanonicalItems.Select(Clone));

        try
        {
            await database.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            // A concurrently-started host already seeded the menu. Discard our pending inserts.
            database.ChangeTracker.Clear();
        }
    }

    // The static canonical list is shared template state; never attach those instances to a context.
    private static MenuItem Clone(MenuItem item) =>
        new()
        {
            Id = item.Id,
            Name = item.Name,
            DefaultPriceCents = item.DefaultPriceCents,
            Kind = item.Kind,
            MaterialIcon = item.MaterialIcon,
            Note = item.Note,
            IsInsider = item.IsInsider,
            SortOrder = item.SortOrder,
            IsAvailable = item.IsAvailable,
        };

    private static bool IsUniqueViolation(DbUpdateException ex) =>
        ex.InnerException is SqliteException { SqliteErrorCode: 19 };
}
