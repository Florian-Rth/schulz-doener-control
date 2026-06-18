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
        var items = await database
            .MenuItems.AsNoTracking()
            .OrderBy(item => item.SortOrder)
            .ToListAsync(ct);

        var details = new MenuDetails(
            items.Select(Map).ToList(),
            OrderVocabulary.PizzaVariants,
            OrderVocabulary.SauceOptions,
            OrderVocabulary.MeatOptions
        );

        return Result<MenuDetails>.Success(details);
    }

    private static MenuItemSummary Map(MenuItem item) =>
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

    private static string KindToString(ProductKind kind) =>
        kind switch
        {
            ProductKind.Doener => "doener",
            ProductKind.Pizza => "pizza",
            _ => throw new ArgumentOutOfRangeException(nameof(kind), kind, null),
        };
}
