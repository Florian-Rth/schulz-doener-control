using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Application.Categories;
using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Api.Endpoints.Admin.Categories;

public sealed record PostAdminCategoryRequest(
    string Key,
    string Name,
    int SortOrder,
    bool IsAvailable
);

public sealed record PostAdminCategoryResponse(AdminCategorySummaryDto Item);

public sealed class PostAdminCategoryRequestValidator : Validator<PostAdminCategoryRequest>
{
    public PostAdminCategoryRequestValidator()
    {
        RuleFor(request => request.Key)
            .NotEmpty()
            .WithMessage("Der Schlüssel darf nicht leer sein, Chef.")
            .MaximumLength(64);

        RuleFor(request => request.Name)
            .NotEmpty()
            .WithMessage("Der Name darf nicht leer sein, Chef.")
            .MaximumLength(128);
    }
}

// Creates a new food category in the active store. A duplicate key is a 409. Admin-only.
public sealed class PostAdminCategory
    : Endpoint<PostAdminCategoryRequest, PostAdminCategoryResponse>
{
    private readonly ICategoryService categoryService;

    public PostAdminCategory(ICategoryService categoryService)
    {
        this.categoryService = categoryService;
    }

    public override void Configure()
    {
        Post("/api/admin/categories");
        Roles("Admin");
    }

    public override async Task HandleAsync(PostAdminCategoryRequest req, CancellationToken ct)
    {
        var command = new CreateCategoryCommand(req.Key, req.Name, req.SortOrder, req.IsAvailable);

        var result = await categoryService.CreateAsync(command, ct);
        if (!result.IsSuccess)
        {
            if (result.Error is { } message)
                AddError(message);

            if (result.Status == ResultStatus.Conflict)
                await Send.ErrorsAsync(StatusCodes.Status409Conflict, cancellation: ct);
            else
                await Send.ErrorsAsync(cancellation: ct);
            return;
        }

        await Send.CreatedAtAsync<GetAdminCategories>(
            routeValues: null,
            responseBody: new PostAdminCategoryResponse(AdminCategoryMapper.ToDto(result.Value)),
            generateAbsoluteUrl: false,
            cancellation: ct
        );
    }
}
