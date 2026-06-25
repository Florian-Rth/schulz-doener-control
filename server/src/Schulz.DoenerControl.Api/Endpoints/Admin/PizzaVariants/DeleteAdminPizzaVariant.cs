using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Application.PizzaVariants;
using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Api.Endpoints.Admin.PizzaVariants;

public sealed class DeleteAdminPizzaVariantRequest
{
    [RouteParam]
    public Guid Id { get; set; }
}

public sealed class DeleteAdminPizzaVariantRequestValidator
    : Validator<DeleteAdminPizzaVariantRequest>
{
    public DeleteAdminPizzaVariantRequestValidator()
    {
        RuleFor(request => request.Id).NotEmpty();
    }
}

// Removes a pizza variant. A variant referenced by any order line is soft-retired
// (IsAvailable=false) instead of hard-deleted so its frozen order FKs survive; an unreferenced
// variant is hard-deleted. Either way the response is 204. 404 if no such variant. Admin-only.
public sealed class DeleteAdminPizzaVariant : Endpoint<DeleteAdminPizzaVariantRequest>
{
    private readonly IPizzaVariantService pizzaVariantService;

    public DeleteAdminPizzaVariant(IPizzaVariantService pizzaVariantService)
    {
        this.pizzaVariantService = pizzaVariantService;
    }

    public override void Configure()
    {
        Delete("/api/admin/pizza-variants/{Id}");
        Roles("Admin");
    }

    public override async Task HandleAsync(DeleteAdminPizzaVariantRequest req, CancellationToken ct)
    {
        var result = await pizzaVariantService.RemoveAsync(req.Id, ct);
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
