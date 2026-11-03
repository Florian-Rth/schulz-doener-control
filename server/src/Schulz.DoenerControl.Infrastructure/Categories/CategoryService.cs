using Microsoft.EntityFrameworkCore;
using Schulz.DoenerControl.Application.Categories;
using Schulz.DoenerControl.Core;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Infrastructure.Persistence;

namespace Schulz.DoenerControl.Infrastructure.Categories;

// Admin CRUD for food categories, scoped to the single active store (lowest-SortOrder active store,
// mirroring MenuService). Category keys are immutable; a category referenced by any menu item cannot
// be deleted (would orphan the item's FK) and is rejected with a conflict. Field links are managed
// wholesale via SetFields, which replaces the category's CategoryField rows.
public sealed class CategoryService : ICategoryService
{
    private readonly AppDbContext database;

    public CategoryService(AppDbContext database)
    {
        this.database = database;
    }

    public async Task<Result<IReadOnlyList<CategoryDetails>>> ListAllAsync(CancellationToken ct)
    {
        var storeId = await ActiveStoreIdAsync(ct);

        var categories = await database
            .Categories.AsNoTracking()
            .Where(category => category.StoreId == storeId)
            .Include(category => category.Fields!)
                .ThenInclude(link => link.FieldDefinition!)
            .OrderBy(category => category.SortOrder)
            .ToListAsync(ct);

        IReadOnlyList<CategoryDetails> details = categories.Select(MapDetails).ToList();
        return Result<IReadOnlyList<CategoryDetails>>.Success(details);
    }

    public async Task<Result<CategoryDetails>> CreateAsync(
        CreateCategoryCommand command,
        CancellationToken ct
    )
    {
        var storeId = await ActiveStoreIdAsync(ct);
        if (storeId is null)
            return Result<CategoryDetails>.Validation("Kein aktiver Laden vorhanden, Chef.");

        var key = command.Key.Trim();
        if (await database.Categories.AnyAsync(c => c.StoreId == storeId && c.Key == key, ct))
        {
            return Result<CategoryDetails>.Conflict(
                $"Eine Kategorie mit dem Schlüssel '{key}' existiert bereits, Chef."
            );
        }

        var category = new Category
        {
            Id = Guid.NewGuid(),
            StoreId = storeId.Value,
            Key = key,
            Name = command.Name.Trim(),
            SortOrder = command.SortOrder,
            IsAvailable = command.IsAvailable,
            Fields = [],
        };
        database.Categories.Add(category);
        await database.SaveChangesAsync(ct);

        return Result<CategoryDetails>.Success(MapDetails(category));
    }

    public async Task<Result<CategoryDetails>> UpdateAsync(
        UpdateCategoryCommand command,
        CancellationToken ct
    )
    {
        var storeId = await ActiveStoreIdAsync(ct);
        var category = await FindWithFieldsAsync(command.Key.Trim(), storeId, ct);
        if (category is null)
            return Result<CategoryDetails>.NotFound(NotFoundMessage(command.Key));

        category.Name = command.Name.Trim();
        category.SortOrder = command.SortOrder;
        category.IsAvailable = command.IsAvailable;
        await database.SaveChangesAsync(ct);

        return Result<CategoryDetails>.Success(MapDetails(category));
    }

    public async Task<Result> DeleteAsync(string key, CancellationToken ct)
    {
        var storeId = await ActiveStoreIdAsync(ct);
        var trimmedKey = key.Trim();
        var category = await database.Categories.FirstOrDefaultAsync(
            c => c.StoreId == storeId && c.Key == trimmedKey,
            ct
        );
        if (category is null)
            return Result.NotFound(NotFoundMessage(key));

        // A category referenced by a menu item is a FK the item froze onto; hard-deleting it would
        // orphan that item, so the deletion is rejected rather than silently cascading.
        var isReferenced = await database.MenuItems.AnyAsync(
            item => item.CategoryId == category.Id,
            ct
        );
        if (isReferenced)
        {
            return Result.Conflict(
                $"Die Kategorie '{trimmedKey}' wird von einem Menüeintrag genutzt und kann nicht "
                    + "gelöscht werden, Chef."
            );
        }

        // The category's CategoryField links cascade-delete with it (never the shared fields).
        database.Categories.Remove(category);
        await database.SaveChangesAsync(ct);
        return Result.Success();
    }

    public async Task<Result<CategoryDetails>> SetFieldsAsync(
        SetCategoryFieldsCommand command,
        CancellationToken ct
    )
    {
        var storeId = await ActiveStoreIdAsync(ct);
        var category = await FindWithFieldsAsync(command.CategoryKey.Trim(), storeId, ct);
        if (category is null)
            return Result<CategoryDetails>.NotFound(NotFoundMessage(command.CategoryKey));

        var fieldIdsByKey = await database
            .FieldDefinitions.Where(field => field.StoreId == storeId)
            .ToDictionaryAsync(field => field.Key, field => field.Id, ct);

        foreach (var link in command.Fields)
        {
            if (!fieldIdsByKey.ContainsKey(link.FieldKey.Trim()))
            {
                return Result<CategoryDetails>.Validation(
                    $"Unbekanntes Feld '{link.FieldKey}', Chef."
                );
            }
        }

        // Replace the whole link set: drop the existing rows, then recreate exactly the given ones.
        database.CategoryFields.RemoveRange(category.Fields ?? []);
        var replacement = command
            .Fields.Select(link => new CategoryField
            {
                Id = Guid.NewGuid(),
                CategoryId = category.Id,
                FieldDefinitionId = fieldIdsByKey[link.FieldKey.Trim()],
                SortOrder = link.SortOrder,
                IsRequired = link.IsRequired,
            })
            .ToList();
        database.CategoryFields.AddRange(replacement);
        await database.SaveChangesAsync(ct);

        var reloaded = await FindWithFieldsAsync(category.Key, storeId, ct);
        return Result<CategoryDetails>.Success(MapDetails(reloaded!));
    }

    private async Task<Category?> FindWithFieldsAsync(
        string key,
        Guid? storeId,
        CancellationToken ct
    ) =>
        await database
            .Categories.Where(category => category.StoreId == storeId && category.Key == key)
            .Include(category => category.Fields!)
                .ThenInclude(link => link.FieldDefinition!)
            .FirstOrDefaultAsync(ct);

    private async Task<Guid?> ActiveStoreIdAsync(CancellationToken ct) =>
        await database
            .Stores.AsNoTracking()
            .Where(store => store.IsActive)
            .OrderBy(store => store.SortOrder)
            .Select(store => (Guid?)store.Id)
            .FirstOrDefaultAsync(ct);

    private static string NotFoundMessage(string key) =>
        $"Keine Kategorie mit dem Schlüssel '{key}', Chef.";

    private static CategoryDetails MapDetails(Category category) =>
        new(
            category.Key,
            category.Name,
            category.SortOrder,
            category.IsAvailable,
            (category.Fields ?? [])
                .OrderBy(link => link.SortOrder)
                .Select(link => new CategoryFieldLink(
                    link.FieldDefinition!.Key,
                    link.SortOrder,
                    link.IsRequired
                ))
                .ToList()
        );
}
