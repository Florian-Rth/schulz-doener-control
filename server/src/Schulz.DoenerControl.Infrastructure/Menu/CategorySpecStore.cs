using Microsoft.EntityFrameworkCore;
using Schulz.DoenerControl.Application.Calculators;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Infrastructure.Persistence;

namespace Schulz.DoenerControl.Infrastructure.Menu;

// Resolves Category / CategoryField / FieldDefinition / FieldOption rows into the pure Application
// CategorySpec projection the ordering calculators consume, so entities never cross the service
// boundary. The catalog is tiny (one store, a handful of categories), so loading the whole set in one
// query per request is trivial. Options are returned in full — including retired ones — so historical
// orders still render their labels; AnswerValidator is the one that rejects unavailable options on
// write.
public sealed class CategorySpecStore
{
    private readonly AppDbContext database;

    public CategorySpecStore(AppDbContext database)
    {
        this.database = database;
    }

    public async Task<IReadOnlyDictionary<Guid, CategorySpec>> LoadByIdAsync(CancellationToken ct)
    {
        var categories = await LoadCategoriesAsync(ct);
        return categories.ToDictionary(category => category.Id, ToSpec);
    }

    private async Task<List<Category>> LoadCategoriesAsync(CancellationToken ct) =>
        await database
            .Categories.AsNoTracking()
            .Include(category => category.Fields!)
                .ThenInclude(link => link.FieldDefinition!)
                    .ThenInclude(field => field.Options!)
            .ToListAsync(ct);

    public static CategorySpec ToSpec(Category category) =>
        new(
            category.Key,
            (category.Fields ?? []).OrderBy(link => link.SortOrder).Select(ToFieldSpec).ToList()
        );

    private static FieldSpec ToFieldSpec(CategoryField link)
    {
        var field = link.FieldDefinition!;
        return new FieldSpec(
            field.Key,
            field.Label,
            field.Type,
            field.Display,
            link.IsRequired,
            field.MaxLength,
            (field.Options ?? [])
                .OrderBy(option => option.SortOrder)
                .Select(option => new OptionSpec(
                    option.Key,
                    option.Label,
                    option.Icon,
                    option.PriceDeltaCents,
                    option.IsAvailable
                ))
                .ToList()
        );
    }
}
