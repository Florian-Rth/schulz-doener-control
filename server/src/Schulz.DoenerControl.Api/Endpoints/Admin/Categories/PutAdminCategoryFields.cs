using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Application.Categories;
using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Api.Endpoints.Admin.Categories;

public sealed record CategoryFieldLinkDataDto(string FieldKey, int SortOrder, bool IsRequired);

public sealed class PutAdminCategoryFieldsRequest
{
    [RouteParam]
    public string Key { get; set; } = string.Empty;

    public IReadOnlyList<CategoryFieldLinkDataDto> Fields { get; set; } = [];
}

public sealed record PutAdminCategoryFieldsResponse(AdminCategorySummaryDto Item);

public sealed class PutAdminCategoryFieldsRequestValidator
    : Validator<PutAdminCategoryFieldsRequest>
{
    public PutAdminCategoryFieldsRequestValidator()
    {
        RuleFor(request => request.Key).NotEmpty().MaximumLength(64);

        RuleForEach(request => request.Fields)
            .ChildRules(field =>
                field
                    .RuleFor(link => link.FieldKey)
                    .NotEmpty()
                    .WithMessage("Der Feldschlüssel darf nicht leer sein, Chef.")
                    .MaximumLength(64)
            );
    }
}

// Replaces the whole set of field links on a category in one shot. An unknown field key is a 400; a
// missing category is a 404. Admin-only.
public sealed class PutAdminCategoryFields
    : Endpoint<PutAdminCategoryFieldsRequest, PutAdminCategoryFieldsResponse>
{
    private readonly ICategoryService categoryService;

    public PutAdminCategoryFields(ICategoryService categoryService)
    {
        this.categoryService = categoryService;
    }

    public override void Configure()
    {
        Put("/api/admin/categories/{Key}/fields");
        Roles("Admin");
    }

    public override async Task HandleAsync(PutAdminCategoryFieldsRequest req, CancellationToken ct)
    {
        var command = new SetCategoryFieldsCommand(
            req.Key,
            req.Fields.Select(link => new CategoryFieldLink(
                    link.FieldKey,
                    link.SortOrder,
                    link.IsRequired
                ))
                .ToList()
        );

        var result = await categoryService.SetFieldsAsync(command, ct);
        if (!result.IsSuccess)
        {
            if (result.Status == ResultStatus.NotFound)
            {
                await Send.NotFoundAsync(ct);
                return;
            }

            if (result.Error is { } message)
                AddError(message);
            await Send.ErrorsAsync(cancellation: ct);
            return;
        }

        await Send.OkAsync(
            new PutAdminCategoryFieldsResponse(AdminCategoryMapper.ToDto(result.Value)),
            cancellation: ct
        );
    }
}
