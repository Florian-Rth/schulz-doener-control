using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Application.Menu;
using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Api.Endpoints.Admin.Menu;

public sealed class DeleteAdminMenuRequest
{
    [RouteParam]
    public string Id { get; set; } = string.Empty;
}

public sealed class DeleteAdminMenuRequestValidator : Validator<DeleteAdminMenuRequest>
{
    public DeleteAdminMenuRequestValidator()
    {
        RuleFor(request => request.Id).NotEmpty().MaximumLength(32);
    }
}

// Removes a menu item. An item referenced by any order is soft-retired (IsAvailable=false) instead
// of hard-deleted so its frozen order FKs survive; an unreferenced item is hard-deleted. Either way
// the response is 204. 404 if no such item. Admin-only.
public sealed class DeleteAdminMenu : Endpoint<DeleteAdminMenuRequest>
{
    private readonly IMenuService menuService;

    public DeleteAdminMenu(IMenuService menuService)
    {
        this.menuService = menuService;
    }

    public override void Configure()
    {
        Delete("/api/admin/menu/{Id}");
        Roles("Admin");
    }

    public override async Task HandleAsync(DeleteAdminMenuRequest req, CancellationToken ct)
    {
        var result = await menuService.RemoveAsync(req.Id, ct);
        if (!result.IsSuccess)
        {
            if (result.Status == ResultStatus.NotFound)
            {
                await Send.NotFoundAsync(ct);
                return;
            }

            await Send.ErrorsAsync(cancellation: ct);
            return;
        }

        await Send.NoContentAsync(ct);
    }
}
