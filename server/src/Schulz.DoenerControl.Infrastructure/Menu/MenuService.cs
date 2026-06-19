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
        // The public order form must never offer a retired item, so only available rows are returned.
        var items = await database
            .MenuItems.AsNoTracking()
            .Where(item => item.IsAvailable)
            .OrderBy(item => item.SortOrder)
            .ToListAsync(ct);

        var details = new MenuDetails(
            items.Select(MapSummary).ToList(),
            OrderVocabulary.PizzaVariants,
            OrderVocabulary.SauceOptions,
            OrderVocabulary.MeatOptions
        );

        return Result<MenuDetails>.Success(details);
    }

    public async Task<Result<IReadOnlyList<MenuItemDetails>>> ListAllAsync(CancellationToken ct)
    {
        var items = await database
            .MenuItems.AsNoTracking()
            .OrderBy(item => item.SortOrder)
            .ToListAsync(ct);

        IReadOnlyList<MenuItemDetails> details = items.Select(MapDetails).ToList();
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

        var item = new MenuItem
        {
            Id = id,
            Name = command.Name.Trim(),
            DefaultPriceCents = command.DefaultPriceCents,
            Kind = command.Kind,
            MaterialIcon = command.MaterialIcon.Trim(),
            Note = NormalizeNote(command.Note),
            IsInsider = command.IsInsider,
            SortOrder = command.SortOrder,
            IsAvailable = command.IsAvailable,
        };

        database.MenuItems.Add(item);
        await database.SaveChangesAsync(ct);

        return Result<MenuItemDetails>.Success(MapDetails(item));
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

        item.Name = command.Name.Trim();
        item.DefaultPriceCents = command.DefaultPriceCents;
        item.Kind = command.Kind;
        item.MaterialIcon = command.MaterialIcon.Trim();
        item.Note = NormalizeNote(command.Note);
        item.IsInsider = command.IsInsider;
        item.SortOrder = command.SortOrder;
        item.IsAvailable = command.IsAvailable;

        await database.SaveChangesAsync(ct);

        return Result<MenuItemDetails>.Success(MapDetails(item));
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
        var isReferenced = await database.Orders.AnyAsync(order => order.ProductId == id, ct);
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

    private static MenuItemSummary MapSummary(MenuItem item) =>
        new(
            item.Id,
            item.Name,
            item.DefaultPriceCents,
            MoneyFormatter.ToGermanString(item.DefaultPriceCents),
            KindToString(item.Kind),
            item.MaterialIcon,
            item.Note,
            item.IsInsider,
            item.SortOrder
        );

    private static MenuItemDetails MapDetails(MenuItem item) =>
        new(
            item.Id,
            item.Name,
            item.DefaultPriceCents,
            MoneyFormatter.ToGermanString(item.DefaultPriceCents),
            KindToString(item.Kind),
            item.MaterialIcon,
            item.Note,
            item.IsInsider,
            item.SortOrder,
            item.IsAvailable
        );

    private static string? NormalizeNote(string? note) =>
        string.IsNullOrWhiteSpace(note) ? null : note.Trim();

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
    private static string KindToString(ProductKind kind) =>
        kind switch
        {
            ProductKind.Doener => "doener",
            ProductKind.Pizza => "pizza",
            _ => throw new ArgumentOutOfRangeException(nameof(kind), kind, null),
        };
}
