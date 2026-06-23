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
    public static readonly IReadOnlyList<(string Synonym, string Body)> CanonicalTemplates = new[]
    {
        (
            "Drehspieß-Tasche",
            "Wer hat Bock auf 'ne Drehspieß-Tasche? Heute wird bestellt – jetzt einchecken!"
        ),
        (
            "Osmanischer Fleischeimer",
            "Heute gibt's den Osmanischen Fleischeimer. Wer ist dabei? Jetzt eintragen!"
        ),
        ("Fleisch-Rucksack", "Döner-Tag! Wer schnürt den Fleisch-Rucksack mit? Jetzt einchecken."),
        ("Donatello", "Heute holen wir uns 'nen Donatello. Jemand dabei? Schnell eintragen!"),
        (
            "Rindfleisch-Knoppers",
            "Hab Hunger, Kollegen. Heute gibt's ein Rindfleisch-Knoppers – jemand dabei?"
        ),
        (
            "Drehmoment-Mäppchen",
            "Döner-Tag läuft! Wer will ein Drehmoment-Mäppchen? Jetzt einchecken."
        ),
        (
            "Anatolische Fleischbombe",
            "Heute zündet die Anatolische Fleischbombe. Wer ist am Start? Jetzt eintragen!"
        ),
        ("Klappkatze", "Wer hat Bock auf Klappkatze? Heute wird bestellt – jetzt einchecken!"),
        (
            "Alu-Banane",
            "Krummes Ding gefällig? Heute rollen die Alu-Bananen (ja, Dürüm). Wer ist dabei?"
        ),
        (
            "Gehacktes-Tasche",
            "Heute wird die Gehacktes-Tasche gepackt. Jemand am Start? Jetzt eintragen!"
        ),
        ("Türkische Maultasche", "Döner-Tag! Wer will 'ne Türkische Maultasche? Jetzt einchecken."),
        ("Gulasch Kanister", "Hunger? Heute zapfen wir 'nen Gulasch Kanister. Jemand dabei?"),
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
