using System.Diagnostics.Contracts;
using Microsoft.EntityFrameworkCore;
using Schulz.DoenerControl.Application.Calculators;
using Schulz.DoenerControl.Application.Menu;
using Schulz.DoenerControl.Core;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Core.Enums;
using Schulz.DoenerControl.Infrastructure.Persistence;

namespace Schulz.DoenerControl.Infrastructure.Menu;

public sealed class MenuService : IMenuService
{
    private readonly AppDbContext database;

    public MenuService(AppDbContext database)
    {
        this.database = database;
    }

    public async Task<Result<MenuDetails>> GetMenuAsync(CancellationToken ct)
    {
        var storeId = await ActiveStoreIdAsync(ct);

        var categories = await database
            .Categories.AsNoTracking()
            .Where(category => category.StoreId == storeId)
            .Include(category => category.Fields!)
                .ThenInclude(link => link.FieldDefinition!)
                    .ThenInclude(field => field.Options!)
            .OrderBy(category => category.SortOrder)
            .ToListAsync(ct);

        var categoryKeyById = categories.ToDictionary(
            category => category.Id,
            category => category.Key
        );
        var categoryDetails = categories
            .Where(category => category.IsAvailable)
            .Select(MapCategory)
            .ToList();

        // The public order form must never offer a retired item, so only available rows are returned.
        var items = await database
            .MenuItems.AsNoTracking()
            .Where(item => item.IsAvailable && item.StoreId == storeId)
            .OrderBy(item => item.SortOrder)
            .ToListAsync(ct);

        var itemSummaries = items.Select(item => MapSummary(item, categoryKeyById)).ToList();

        return Result<MenuDetails>.Success(new MenuDetails(categoryDetails, itemSummaries));
    }

    public async Task<Result<IReadOnlyList<MenuItemDetails>>> ListAllAsync(CancellationToken ct)
    {
        var categoryKeyById = await database
            .Categories.AsNoTracking()
            .ToDictionaryAsync(category => category.Id, category => category.Key, ct);

        var items = await database
            .MenuItems.AsNoTracking()
            .OrderBy(item => item.SortOrder)
            .ToListAsync(ct);

        IReadOnlyList<MenuItemDetails> details = items
            .Select(item => MapDetails(item, categoryKeyById))
            .ToList();
        return Result<IReadOnlyList<MenuItemDetails>>.Success(details);
    }

    public async Task<Result<MenuItemDetails>> CreateAsync(
        CreateMenuItemCommand command,
        CancellationToken ct
    )
    {
        var id = string.IsNullOrWhiteSpace(command.Id) ? Slugify(command.Name) : command.Id.Trim();
        if (id.Length == 0)
        {
            return Result<MenuItemDetails>.Validation(
                "Aus dem Namen lässt sich keine ID ableiten, Chef. Gib eine ID an."
            );
        }

        if (await database.MenuItems.AnyAsync(item => item.Id == id, ct))
        {
            return Result<MenuItemDetails>.Conflict(
                $"Ein Menüeintrag mit der ID '{id}' existiert bereits, Chef."
            );
        }

        var storeId = await ActiveStoreIdAsync(ct);
        var categoryResult = await ResolveCategoryIdAsync(command.CategoryKey, storeId, ct);
        if (!categoryResult.IsSuccess)
            return Result<MenuItemDetails>.Validation(categoryResult.Error!);

        var item = new MenuItem
        {
            Id = id,
            StoreId = storeId,
            CategoryId = categoryResult.Value,
            BaseItemId = NormalizeOptional(command.BaseItemId),
            Name = command.Name.Trim(),
            DefaultPriceCents = command.DefaultPriceCents,
            MaterialIcon = command.MaterialIcon.Trim(),
            Note = NormalizeOptional(command.Note),
            IsInsider = command.IsInsider,
            SortOrder = command.SortOrder,
            IsAvailable = command.IsAvailable,
            DefaultAnswers = command.DefaultAnswers,
        };

        database.MenuItems.Add(item);
        await database.SaveChangesAsync(ct);

        var categoryKeyById = await database
            .Categories.AsNoTracking()
            .ToDictionaryAsync(category => category.Id, category => category.Key, ct);
        return Result<MenuItemDetails>.Success(MapDetails(item, categoryKeyById));
    }

    public async Task<Result<MenuItemDetails>> UpdateAsync(
        UpdateMenuItemCommand command,
        CancellationToken ct
    )
    {
        var item = await database.MenuItems.FirstOrDefaultAsync(
            menuItem => menuItem.Id == command.Id,
            ct
        );
        if (item is null)
        {
            return Result<MenuItemDetails>.NotFound(
                $"Kein Menüeintrag mit der ID '{command.Id}', Chef."
            );
        }

        var storeId = item.StoreId ?? await ActiveStoreIdAsync(ct);
        var categoryResult = await ResolveCategoryIdAsync(command.CategoryKey, storeId, ct);
        if (!categoryResult.IsSuccess)
            return Result<MenuItemDetails>.Validation(categoryResult.Error!);

        item.Name = command.Name.Trim();
        item.CategoryId = categoryResult.Value;
        item.BaseItemId = NormalizeOptional(command.BaseItemId);
        item.DefaultPriceCents = command.DefaultPriceCents;
        item.MaterialIcon = command.MaterialIcon.Trim();
        item.Note = NormalizeOptional(command.Note);
        item.IsInsider = command.IsInsider;
        item.SortOrder = command.SortOrder;
        item.IsAvailable = command.IsAvailable;
        item.DefaultAnswers = command.DefaultAnswers;

        await database.SaveChangesAsync(ct);

        var categoryKeyById = await database
            .Categories.AsNoTracking()
            .ToDictionaryAsync(category => category.Id, category => category.Key, ct);
        return Result<MenuItemDetails>.Success(MapDetails(item, categoryKeyById));
    }

    public async Task<Result<MenuItemRemoval>> RemoveAsync(string id, CancellationToken ct)
    {
        var item = await database.MenuItems.FirstOrDefaultAsync(menuItem => menuItem.Id == id, ct);
        if (item is null)
        {
            return Result<MenuItemRemoval>.NotFound($"Kein Menüeintrag mit der ID '{id}', Chef.");
        }

        // A referenced item is frozen into past orders' FKs; hard-deleting it would orphan them, so
        // it is soft-retired instead. Only an unreferenced item is actually removed.
        var isReferenced = await database.OrderLines.AnyAsync(line => line.ProductId == id, ct);
        if (isReferenced)
        {
            item.IsAvailable = false;
            await database.SaveChangesAsync(ct);
            return Result<MenuItemRemoval>.Success(MenuItemRemoval.Retired);
        }

        database.MenuItems.Remove(item);
        await database.SaveChangesAsync(ct);
        return Result<MenuItemRemoval>.Success(MenuItemRemoval.Deleted);
    }

    private async Task<Guid?> ActiveStoreIdAsync(CancellationToken ct) =>
        await database
            .Stores.AsNoTracking()
            .Where(store => store.IsActive)
            .OrderBy(store => store.SortOrder)
            .Select(store => (Guid?)store.Id)
            .FirstOrDefaultAsync(ct);

    // Resolves a category key to its id within the store; null key → null id (unassigned). An unknown
    // key is a validation failure so the admin can't point an item at a non-existent category.
    private async Task<Result<Guid?>> ResolveCategoryIdAsync(
        string? categoryKey,
        Guid? storeId,
        CancellationToken ct
    )
    {
        var key = NormalizeOptional(categoryKey);
        if (key is null)
            return Result<Guid?>.Success(null);

        var categoryId = await database
            .Categories.AsNoTracking()
            .Where(category => category.StoreId == storeId && category.Key == key)
            .Select(category => (Guid?)category.Id)
            .FirstOrDefaultAsync(ct);

        return categoryId is null
            ? Result<Guid?>.Validation($"Unbekannte Kategorie '{key}', Chef.")
            : Result<Guid?>.Success(categoryId);
    }

    private static MenuCategoryDetails MapCategory(Category category) =>
        new(
            category.Key,
            category.Name,
            category.SortOrder,
            (category.Fields ?? []).OrderBy(link => link.SortOrder).Select(MapField).ToList()
        );

    private static MenuFieldDetails MapField(CategoryField link)
    {
        var field = link.FieldDefinition!;
        return new MenuFieldDetails(
            field.Key,
            field.Label,
            TypeToken(field.Type),
            DisplayToken(field.Display),
            field.MaxLength,
            link.IsRequired,
            (field.Options ?? [])
                .Where(option => option.IsAvailable)
                .OrderBy(option => option.SortOrder)
                .Select(option => new MenuOptionDetails(
                    option.Key,
                    option.Label,
                    option.Icon,
                    option.PriceDeltaCents
                ))
                .ToList()
        );
    }

    private static MenuItemSummary MapSummary(
        MenuItem item,
        IReadOnlyDictionary<Guid, string> categoryKeyById
    ) =>
        new(
            item.Id,
            item.Name,
            ResolveCategoryKey(item, categoryKeyById),
            item.BaseItemId,
            item.DefaultPriceCents,
            MoneyFormatter.ToGermanString(item.DefaultPriceCents),
            item.MaterialIcon,
            item.Note,
            item.IsInsider,
            item.SortOrder,
            item.DefaultAnswers
        );

    private static MenuItemDetails MapDetails(
        MenuItem item,
        IReadOnlyDictionary<Guid, string> categoryKeyById
    ) =>
        new(
            item.Id,
            item.Name,
            ResolveCategoryKey(item, categoryKeyById),
            item.BaseItemId,
            item.DefaultPriceCents,
            MoneyFormatter.ToGermanString(item.DefaultPriceCents),
            item.MaterialIcon,
            item.Note,
            item.IsInsider,
            item.SortOrder,
            item.IsAvailable,
            item.DefaultAnswers
        );

    private static string? ResolveCategoryKey(
        MenuItem item,
        IReadOnlyDictionary<Guid, string> categoryKeyById
    ) =>
        item.CategoryId is { } categoryId && categoryKeyById.TryGetValue(categoryId, out var key)
            ? key
            : null;

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    [Pure]
    private static string Slugify(string name)
    {
        var slug = new string(
            name.Trim()
                .ToLowerInvariant()
                .Select(character => char.IsLetterOrDigit(character) ? character : '-')
                .ToArray()
        );

        while (slug.Contains("--"))
        {
            slug = slug.Replace("--", "-");
        }

        return slug.Trim('-');
    }

    [Pure]
    private static string TypeToken(FieldType type) =>
        type switch
        {
            FieldType.SingleSelect => "single",
            FieldType.MultiSelect => "multi",
            FieldType.Text => "text",
            _ => throw new ArgumentOutOfRangeException(nameof(type), type, null),
        };

    [Pure]
    private static string DisplayToken(FieldDisplay display) =>
        display switch
        {
            FieldDisplay.Segmented => "segmented",
            FieldDisplay.Chips => "chips",
            FieldDisplay.Dropdown => "dropdown",
            FieldDisplay.Textarea => "textarea",
            _ => throw new ArgumentOutOfRangeException(nameof(display), display, null),
        };
}
