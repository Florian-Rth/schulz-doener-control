using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Schulz.DoenerControl.Core.Entities;

namespace Schulz.DoenerControl.Infrastructure.Persistence.Seeding;

// Idempotent runtime seed for the open-day notification texts. Like the menu, these are ordinary
// editable rows (not migration-managed HasData) so the admin can create, edit, disable and delete
// them through the API. Each canonical text features one of the absurd Döner synonyms and is phrased
// a little differently; a fresh database is bootstrapped with the standard set exactly once.
//
// Seeding is all-or-nothing on emptiness: if any template already exists this is a no-op, so an
// admin who has since edited the set is never overwritten.
public sealed class NotificationTemplateSeeder
{
    // Each body opens with the {OPENER_NAME} token: at open time the service substitutes the
    // opener's display name (and leaves the rest of the playful synonym pitch intact). A template
    // without the token still works — the substitution is a no-op when the token is absent.
    public static readonly IReadOnlyList<(string Synonym, string Body)> CanonicalTemplates = new[]
    {
        (
            "Drehspieß-Tasche",
            "{OPENER_NAME} hat den Döner-Tag eröffnet — wer hat Bock auf 'ne Drehspieß-Tasche? Jetzt einchecken!"
        ),
        (
            "Osmanischer Fleischeimer",
            "{OPENER_NAME} hat den Döner-Tag eröffnet — heute gibt's den Osmanischen Fleischeimer. Wer ist dabei?"
        ),
        (
            "Fleisch-Rucksack",
            "{OPENER_NAME} hat den Döner-Tag eröffnet — wer schnürt den Fleisch-Rucksack mit? Jetzt einchecken."
        ),
        (
            "Donatello",
            "{OPENER_NAME} hat den Döner-Tag eröffnet — heute holen wir uns 'nen Donatello. Jemand dabei?"
        ),
        (
            "Rindfleisch-Knoppers",
            "{OPENER_NAME} hat den Döner-Tag eröffnet — heute gibt's ein Rindfleisch-Knoppers. Jemand dabei?"
        ),
        (
            "Drehmoment-Mäppchen",
            "{OPENER_NAME} hat den Döner-Tag eröffnet — wer will ein Drehmoment-Mäppchen? Jetzt einchecken."
        ),
        (
            "Anatolische Fleischbombe",
            "{OPENER_NAME} hat den Döner-Tag eröffnet — heute zündet die Anatolische Fleischbombe. Wer ist am Start?"
        ),
        (
            "Klappkatze",
            "{OPENER_NAME} hat den Döner-Tag eröffnet — wer hat Bock auf Klappkatze? Jetzt einchecken!"
        ),
        (
            "Alu-Banane",
            "{OPENER_NAME} hat den Döner-Tag eröffnet — krummes Ding gefällig? Heute rollen die Alu-Bananen (ja, Dürüm)."
        ),
        (
            "Gehacktes-Tasche",
            "{OPENER_NAME} hat den Döner-Tag eröffnet — heute wird die Gehacktes-Tasche gepackt. Jemand am Start?"
        ),
        (
            "Türkische Maultasche",
            "{OPENER_NAME} hat den Döner-Tag eröffnet — wer will 'ne Türkische Maultasche? Jetzt einchecken."
        ),
        (
            "Gulasch Kanister",
            "{OPENER_NAME} hat den Döner-Tag eröffnet — heute zapfen wir 'nen Gulasch Kanister. Jemand dabei?"
        ),
    };

    private readonly AppDbContext database;

    public NotificationTemplateSeeder(AppDbContext database)
    {
        this.database = database;
    }

    public async Task SeedAsync(CancellationToken ct)
    {
        if (await database.NotificationTemplates.AnyAsync(ct))
        {
            return;
        }

        database.NotificationTemplates.AddRange(
            CanonicalTemplates.Select(template => new NotificationTemplate
            {
                Id = Guid.NewGuid(),
                Synonym = template.Synonym,
                Body = template.Body,
                IsActive = true,
            })
        );

        try
        {
            await database.SaveChangesAsync(ct);
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            // A concurrently-started host already seeded the templates. Discard our pending inserts.
            database.ChangeTracker.Clear();
        }
    }

    private static bool IsUniqueViolation(DbUpdateException ex) =>
        ex.InnerException is SqliteException { SqliteErrorCode: 19 };
}
