using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Application.Categories;
using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Api.Endpoints.Admin.Categories;

public sealed class DeleteAdminCategoryRequest
{
    [RouteParam]
    public string Key { get; set; } = string.Empty;
}

public sealed class DeleteAdminCategoryRequestValidator : Validator<DeleteAdminCategoryRequest>
{
    public DeleteAdminCategoryRequestValidator()
    {
        RuleFor(request => request.Key).NotEmpty().MaximumLength(64);
    }
}

// Removes a category. A category referenced by any menu item is rejected with 409 (deleting it would
// orphan the item's FK); otherwise it is deleted (its field links cascade) and the response is 204.
// 404 if no such category. Admin-only.
public sealed class DeleteAdminCategory : Endpoint<DeleteAdminCategoryRequest>
{
    private readonly ICategoryService categoryService;

    public DeleteAdminCategory(ICategoryService categoryService)
    {
        this.categoryService = categoryService;
    }

    public override void Configure()
    {
        Delete("/api/admin/categories/{Key}");
        Roles("Admin");
    }

    public override async Task HandleAsync(DeleteAdminCategoryRequest req, CancellationToken ct)
    {
        var result = await categoryService.DeleteAsync(req.Key, ct);
        if (!result.IsSuccess)
        {
            if (result.Status == ResultStatus.NotFound)
            {
                await Send.NotFoundAsync(ct);
                return;
            }

            if (result.Error is { } message)
                AddError(message);

            if (result.Status == ResultStatus.Conflict)
                await Send.ErrorsAsync(StatusCodes.Status409Conflict, cancellation: ct);
            else
                await Send.ErrorsAsync(cancellation: ct);
            return;
        }

        await Send.NoContentAsync(ct);
    }
}
