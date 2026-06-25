using Microsoft.EntityFrameworkCore;
using Schulz.DoenerControl.Application.PizzaVariants;
using Schulz.DoenerControl.Core;
using Schulz.DoenerControl.Core.Entities;
using Schulz.DoenerControl.Infrastructure.Persistence;

namespace Schulz.DoenerControl.Infrastructure.PizzaVariants;

public sealed class PizzaVariantService : IPizzaVariantService
{
    private readonly AppDbContext database;

    public PizzaVariantService(AppDbContext database)
    {
        this.database = database;
    }

    public async Task<Result<IReadOnlyList<PizzaVariantDetails>>> ListAllAsync(CancellationToken ct)
    {
        var variants = await database
            .PizzaVariants.AsNoTracking()
            .OrderBy(variant => variant.SortOrder)
            .ToListAsync(ct);

        IReadOnlyList<PizzaVariantDetails> details = variants.Select(MapDetails).ToList();
        return Result<IReadOnlyList<PizzaVariantDetails>>.Success(details);
    }

    public async Task<Result<PizzaVariantDetails>> CreateAsync(
        CreatePizzaVariantCommand command,
        CancellationToken ct
    )
    {
        var variant = new PizzaVariant
        {
            Id = Guid.NewGuid(),
            Name = command.Name.Trim(),
            Icon = NormalizeIcon(command.Icon),
            SortOrder = command.SortOrder,
            IsAvailable = command.IsAvailable,
        };

        database.PizzaVariants.Add(variant);
        await database.SaveChangesAsync(ct);

        return Result<PizzaVariantDetails>.Success(MapDetails(variant));
    }

    public async Task<Result<PizzaVariantDetails>> UpdateAsync(
        UpdatePizzaVariantCommand command,
        CancellationToken ct
    )
    {
        var variant = await database.PizzaVariants.FirstOrDefaultAsync(
            row => row.Id == command.Id,
            ct
        );
        if (variant is null)
        {
            return Result<PizzaVariantDetails>.NotFound(
                $"Keine Pizza-Sorte mit der ID '{command.Id}', Chef."
            );
        }

        variant.Name = command.Name.Trim();
        variant.Icon = NormalizeIcon(command.Icon);
        variant.SortOrder = command.SortOrder;
        variant.IsAvailable = command.IsAvailable;

        await database.SaveChangesAsync(ct);

        return Result<PizzaVariantDetails>.Success(MapDetails(variant));
    }

    public async Task<Result<PizzaVariantRemoval>> RemoveAsync(Guid id, CancellationToken ct)
    {
        var variant = await database.PizzaVariants.FirstOrDefaultAsync(row => row.Id == id, ct);
        if (variant is null)
        {
            return Result<PizzaVariantRemoval>.NotFound(
                $"Keine Pizza-Sorte mit der ID '{id}', Chef."
            );
        }

        // A referenced variant is frozen into past orders' FKs; hard-deleting it would orphan them, so
        // it is soft-retired instead. Only an unreferenced variant is actually removed.
        var isReferenced = await database.OrderLines.AnyAsync(
            line => line.PizzaVariantId == id,
            ct
        );
        if (isReferenced)
        {
            variant.IsAvailable = false;
            await database.SaveChangesAsync(ct);
            return Result<PizzaVariantRemoval>.Success(PizzaVariantRemoval.Retired);
        }

        database.PizzaVariants.Remove(variant);
        await database.SaveChangesAsync(ct);
        return Result<PizzaVariantRemoval>.Success(PizzaVariantRemoval.Deleted);
    }

    private static PizzaVariantDetails MapDetails(PizzaVariant variant) =>
        new(variant.Id, variant.Name, variant.Icon, variant.SortOrder, variant.IsAvailable);

    private static string? NormalizeIcon(string? icon) =>
        string.IsNullOrWhiteSpace(icon) ? null : icon.Trim();
}
