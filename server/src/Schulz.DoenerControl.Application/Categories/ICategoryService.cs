using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Application.Categories;

public interface ICategoryService
{
    Task<Result<IReadOnlyList<CategoryDetails>>> ListAllAsync(CancellationToken ct);

    Task<Result<CategoryDetails>> CreateAsync(CreateCategoryCommand command, CancellationToken ct);

    Task<Result<CategoryDetails>> UpdateAsync(UpdateCategoryCommand command, CancellationToken ct);

    Task<Result> DeleteAsync(string key, CancellationToken ct);

    // Replaces the category's whole set of field links with the given ones.
    Task<Result<CategoryDetails>> SetFieldsAsync(
        SetCategoryFieldsCommand command,
        CancellationToken ct
    );
}
