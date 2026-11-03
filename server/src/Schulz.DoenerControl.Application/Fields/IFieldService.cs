using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Application.Fields;

public interface IFieldService
{
    Task<Result<IReadOnlyList<FieldDetails>>> ListAllAsync(CancellationToken ct);

    Task<Result<FieldDetails>> CreateAsync(CreateFieldCommand command, CancellationToken ct);

    Task<Result<FieldDetails>> UpdateAsync(UpdateFieldCommand command, CancellationToken ct);

    Task<Result> DeleteAsync(string key, CancellationToken ct);

    Task<Result<FieldDetails>> AddOptionAsync(AddFieldOptionCommand command, CancellationToken ct);

    Task<Result<FieldDetails>> UpdateOptionAsync(
        UpdateFieldOptionCommand command,
        CancellationToken ct
    );

    Task<Result> DeleteOptionAsync(string fieldKey, string optionKey, CancellationToken ct);
}
