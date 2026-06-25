using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Application.PizzaVariants;

public interface IPizzaVariantService
{
    // Admin management: every variant including retired (unavailable) ones, by SortOrder.
    Task<Result<IReadOnlyList<PizzaVariantDetails>>> ListAllAsync(CancellationToken ct);

    Task<Result<PizzaVariantDetails>> CreateAsync(
        CreatePizzaVariantCommand command,
        CancellationToken ct
    );

    Task<Result<PizzaVariantDetails>> UpdateAsync(
        UpdatePizzaVariantCommand command,
        CancellationToken ct
    );

    Task<Result<PizzaVariantRemoval>> RemoveAsync(Guid id, CancellationToken ct);
}
