using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Application.Categories;
using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Api.Endpoints.Admin.Categories;

public sealed class PutAdminCategoryRequest
{
    [RouteParam]
    public string Key { get; set; } = string.Empty;

    public string Name { get; set; } = string.Empty;

    public int SortOrder { get; set; }

    public bool IsAvailable { get; set; }
}

public sealed record PutAdminCategoryResponse(AdminCategorySummaryDto Item);

public sealed class PutAdminCategoryRequestValidator : Validator<PutAdminCategoryRequest>
{
    public PutAdminCategoryRequestValidator()
    {
        RuleFor(request => request.Key).NotEmpty().MaximumLength(64);

        RuleFor(request => request.Name)
            .NotEmpty()
            .WithMessage("Der Name darf nicht leer sein, Chef.")
            .MaximumLength(128);
    }
}

// Edits an existing category's editable fields (the key itself is immutable). 404 if no such
// category. Admin-only.
public sealed class PutAdminCategory : Endpoint<PutAdminCategoryRequest, PutAdminCategoryResponse>
{
    private readonly ICategoryService categoryService;

    public PutAdminCategory(ICategoryService categoryService)
    {
        this.categoryService = categoryService;
    }

    public override void Configure()
    {
        Put("/api/admin/categories/{Key}");
        Roles("Admin");
    }

    public override async Task HandleAsync(PutAdminCategoryRequest req, CancellationToken ct)
    {
        var command = new UpdateCategoryCommand(req.Key, req.Name, req.SortOrder, req.IsAvailable);

        var result = await categoryService.UpdateAsync(command, ct);
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
            new PutAdminCategoryResponse(AdminCategoryMapper.ToDto(result.Value)),
            cancellation: ct
        );
    }
}
