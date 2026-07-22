using System.Reflection;
using System.Text.Json;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Core.Enums;

namespace Schulz.DoenerControl.Infrastructure.Persistence.Seeding;

// Runtime seed for the generic Category → Field → Option engine + menu items, driven by the embedded
// menu.seed.json (decision #6). Supersedes the old MenuSeeder. Policy (decision #8): upsert by stable
// key, preserving admin edits.
//   • Fields / options / categories / category-field links: inserted when their stable key is
//     missing; existing rows are left untouched (never re-labelled or re-priced).
//   • Menu items: a MISSING item is inserted in full. A legacy item that predates the generic model
//     (CategoryId still null) gets the ONE-TIME establishment — its store/category/base/default
//     answers are filled and its price is reset to the card price (§10.3). An item already
//     established (CategoryId set) is left entirely alone.
// Idempotent + race-safe (mirrors the other seeders' unique-violation handling).
public sealed class GenericMenuSeeder
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    private readonly AppDbContext database;

    public GenericMenuSeeder(AppDbContext database)
    {
        this.database = database;
    }

    public async Task SeedAsync(CancellationToken ct)
    {
        var document = LoadDocument();

        var store = await database.Stores.FirstOrDefaultAsync(s => s.Key == document.StoreKey, ct);
        if (store is null)
        {
            // The store is seeded ahead of this by StoreSeeder; nothing to scope to otherwise.
            return;
        }

        if (!await SeedFieldsAsync(document, store.Id, ct))
            return;
        if (!await SeedCategoriesAsync(document, store.Id, ct))
            return;
        if (!await SeedCategoryFieldsAsync(document, store.Id, ct))
            return;
        await SeedItemsAsync(document, store.Id, ct);
    }

    private async Task<bool> SeedFieldsAsync(
        SeedDocument document,
        Guid storeId,
        CancellationToken ct
    )
    {
        var existingFields = await database
            .FieldDefinitions.Where(field => field.StoreId == storeId)
            .Include(field => field.Options)
            .ToDictionaryAsync(field => field.Key, ct);

        foreach (var seedField in document.Fields)
        {
            if (!existingFields.TryGetValue(seedField.Key, out var field))
            {
                database.FieldDefinitions.Add(NewField(seedField, storeId));
                continue;
            }

            // Insert any options added to the seed since the field was created; never clobber edits.
            var existingKeys = (field.Options ?? []).Select(option => option.Key).ToHashSet();
            var sort = existingKeys.Count;
            foreach (var seedOption in seedField.Options ?? [])
            {
                if (existingKeys.Add(seedOption.Key))
                    database.FieldOptions.Add(NewOption(seedOption, field.Id, sort++));
            }
        }

        return await SaveAsync(ct);
    }

    private async Task<bool> SeedCategoriesAsync(
        SeedDocument document,
        Guid storeId,
        CancellationToken ct
    )
    {
        var existingKeys = (
            await database
                .Categories.Where(category => category.StoreId == storeId)
                .Select(category => category.Key)
                .ToListAsync(ct)
        ).ToHashSet();

        foreach (var seedCategory in document.Categories)
        {
            if (existingKeys.Contains(seedCategory.Key))
                continue;

            database.Categories.Add(
                new Category
                {
                    Id = Guid.NewGuid(),
                    StoreId = storeId,
                    Key = seedCategory.Key,
                    Name = seedCategory.Name,
                    SortOrder = seedCategory.SortOrder,
                    IsAvailable = true,
                }
            );
        }

        return await SaveAsync(ct);
    }

    private async Task<bool> SeedCategoryFieldsAsync(
        SeedDocument document,
        Guid storeId,
        CancellationToken ct
    )
    {
        var categoryIds = await database
            .Categories.Where(category => category.StoreId == storeId)
            .ToDictionaryAsync(category => category.Key, category => category.Id, ct);
        var fieldIds = await database
            .FieldDefinitions.Where(field => field.StoreId == storeId)
            .ToDictionaryAsync(field => field.Key, field => field.Id, ct);
        var existingLinks = (
            await database
                .CategoryFields.Where(link =>
                    database.Categories.Any(category =>
                        category.Id == link.CategoryId && category.StoreId == storeId
                    )
                )
                .Select(link => new { link.CategoryId, link.FieldDefinitionId })
                .ToListAsync(ct)
        )
            .Select(link => (link.CategoryId, link.FieldDefinitionId))
            .ToHashSet();

        foreach (var seedCategory in document.Categories)
        {
            if (!categoryIds.TryGetValue(seedCategory.Key, out var categoryId))
                continue;

            for (var index = 0; index < seedCategory.Fields.Count; index++)
            {
                var reference = seedCategory.Fields[index];
                if (!fieldIds.TryGetValue(reference.Field, out var fieldId))
                    continue;
                if (!existingLinks.Add((categoryId, fieldId)))
                    continue;

                database.CategoryFields.Add(
                    new CategoryField
                    {
                        Id = Guid.NewGuid(),
                        CategoryId = categoryId,
                        FieldDefinitionId = fieldId,
                        SortOrder = index,
                        IsRequired = reference.Required,
                    }
                );
            }
        }

        return await SaveAsync(ct);
    }

    private async Task SeedItemsAsync(SeedDocument document, Guid storeId, CancellationToken ct)
    {
        var categoryIds = await database
            .Categories.Where(category => category.StoreId == storeId)
            .ToDictionaryAsync(category => category.Key, category => category.Id, ct);

        var seedIds = document.Items.Select(item => item.Id).ToList();
        var existing = await database
            .MenuItems.Where(item => seedIds.Contains(item.Id))
            .ToDictionaryAsync(item => item.Id, ct);

        foreach (var seedItem in document.Items)
        {
            Guid? categoryId = categoryIds.TryGetValue(seedItem.Category, out var id) ? id : null;

            if (!existing.TryGetValue(seedItem.Id, out var item))
            {
                database.MenuItems.Add(NewItem(seedItem, storeId, categoryId));
                continue;
            }

            // One-time establishment of a legacy item (never assigned a category yet): fill the new
            // structural columns and reset the price to the card price. Established items are left as-is.
            if (item.CategoryId is null)
            {
                item.StoreId = storeId;
                item.CategoryId = categoryId;
                item.BaseItemId = seedItem.BaseItem;
                item.DefaultPriceCents = seedItem.PriceCents;
                item.DefaultAnswers = BuildAnswers(seedItem.DefaultAnswers);
                if (seedItem.Note is not null)
                    item.Note = seedItem.Note;
            }
        }

        await SaveAsync(ct);
    }

    private static FieldDefinition NewField(SeedField seedField, Guid storeId)
    {
        var field = new FieldDefinition
        {
            Id = Guid.NewGuid(),
            StoreId = storeId,
            Key = seedField.Key,
            Label = seedField.Label,
            Type = ParseType(seedField.Type),
            Display = ParseDisplay(seedField.Display),
            MaxLength = seedField.MaxLength,
            Options = [],
        };

        var sort = 0;
        foreach (var seedOption in seedField.Options ?? [])
        {
            field.Options.Add(NewOption(seedOption, field.Id, sort++));
        }
        return field;
    }

    private static FieldOption NewOption(SeedOption seedOption, Guid fieldId, int sortOrder) =>
        new()
        {
            Id = Guid.NewGuid(),
            FieldDefinitionId = fieldId,
            Key = seedOption.Key,
            Label = seedOption.Label,
            Icon = seedOption.Icon,
            PriceDeltaCents = seedOption.PriceDeltaCents,
            SortOrder = sortOrder,
            IsAvailable = true,
        };

    private static MenuItem NewItem(SeedItem seedItem, Guid storeId, Guid? categoryId) =>
        new()
        {
            Id = seedItem.Id,
            StoreId = storeId,
            CategoryId = categoryId,
            BaseItemId = seedItem.BaseItem,
            Name = seedItem.Name,
            DefaultPriceCents = seedItem.PriceCents,
            MaterialIcon = seedItem.Icon,
            Note = seedItem.Note,
            IsInsider = seedItem.IsInsider,
            SortOrder = seedItem.SortOrder,
            IsAvailable = true,
            DefaultAnswers = BuildAnswers(seedItem.DefaultAnswers),
        };

    private static LineAnswers? BuildAnswers(Dictionary<string, SeedAnswer>? answers)
    {
        if (answers is null || answers.Count == 0)
            return null;

        var fields = answers.ToDictionary(
            pair => pair.Key,
            pair => new AnswerValue(pair.Value.Options ?? [], pair.Value.Text)
        );
        return new LineAnswers(fields);
    }

    private static FieldType ParseType(string type) =>
        type switch
        {
            "single" => FieldType.SingleSelect,
            "multi" => FieldType.MultiSelect,
            "text" => FieldType.Text,
            _ => throw new InvalidOperationException($"Unknown seed field type '{type}'."),
        };

    private static FieldDisplay ParseDisplay(string display) =>
        display switch
        {
            "segmented" => FieldDisplay.Segmented,
            "chips" => FieldDisplay.Chips,
            "dropdown" => FieldDisplay.Dropdown,
            "textarea" => FieldDisplay.Textarea,
            _ => throw new InvalidOperationException($"Unknown seed field display '{display}'."),
        };

    private static SeedDocument LoadDocument()
    {
        var assembly = typeof(GenericMenuSeeder).Assembly;
        var resourceName = assembly
            .GetManifestResourceNames()
            .Single(name => name.EndsWith("menu.seed.json", StringComparison.Ordinal));

        using var stream =
            assembly.GetManifestResourceStream(resourceName)
            ?? throw new InvalidOperationException("Embedded menu.seed.json not found.");

        return JsonSerializer.Deserialize<SeedDocument>(stream, JsonOptions)
            ?? throw new InvalidOperationException("menu.seed.json could not be parsed.");
    }

    // Returns false when a concurrently-started host already seeded these rows, so the caller stops.
    private async Task<bool> SaveAsync(CancellationToken ct)
    {
        try
        {
            await database.SaveChangesAsync(ct);
            return true;
        }
        catch (DbUpdateException ex) when (IsUniqueViolation(ex))
        {
            database.ChangeTracker.Clear();
            return false;
        }
    }

    private static bool IsUniqueViolation(DbUpdateException ex) =>
        ex.InnerException is SqliteException { SqliteErrorCode: 19 };

    private sealed record SeedDocument(
        string StoreKey,
        IReadOnlyList<SeedField> Fields,
        IReadOnlyList<SeedCategory> Categories,
        IReadOnlyList<SeedItem> Items
    );

    private sealed record SeedField(
        string Key,
        string Label,
        string Type,
        string Display,
        int? MaxLength,
        IReadOnlyList<SeedOption>? Options
    );

    private sealed record SeedOption(string Key, string Label, string? Icon, int PriceDeltaCents);

    private sealed record SeedCategory(
        string Key,
        string Name,
        int SortOrder,
        IReadOnlyList<SeedCategoryField> Fields
    );

    private sealed record SeedCategoryField(string Field, bool Required);

    private sealed record SeedItem(
        string Id,
        string Name,
        string Category,
        string? BaseItem,
        int PriceCents,
        string Icon,
        int SortOrder,
        bool IsInsider,
        string? Note,
        Dictionary<string, SeedAnswer>? DefaultAnswers
    );

    private sealed record SeedAnswer(IReadOnlyList<string>? Options, string? Text);
}
