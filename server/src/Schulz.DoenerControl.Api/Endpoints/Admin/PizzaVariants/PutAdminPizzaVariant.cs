using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Application.PizzaVariants;
using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Api.Endpoints.Admin.PizzaVariants;

public sealed class PutAdminPizzaVariantRequest
{
    [RouteParam]
    public Guid Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public string? Icon { get; set; }

    public int SortOrder { get; set; }

    public bool IsAvailable { get; set; }
}

public sealed record PutAdminPizzaVariantResponse(AdminPizzaVariantDto Item);

public sealed class PutAdminPizzaVariantRequestValidator : Validator<PutAdminPizzaVariantRequest>
{
    public PutAdminPizzaVariantRequestValidator()
    {
        RuleFor(request => request.Id).NotEmpty();

        RuleFor(request => request.Name)
            .NotEmpty()
            .WithMessage("Der Name darf nicht leer sein, Chef.")
            .MaximumLength(64);

        RuleFor(request => request.Icon).MaximumLength(64);

        RuleFor(request => request.SortOrder)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Die Reihenfolge darf nicht negativ sein, Chef.");
    }
}

// Edits an existing pizza variant's editable fields (the id itself is immutable). 404 if no such
// variant. Admin-only.
public sealed class PutAdminPizzaVariant
    : Endpoint<PutAdminPizzaVariantRequest, PutAdminPizzaVariantResponse>
{
    private readonly IPizzaVariantService pizzaVariantService;

    public PutAdminPizzaVariant(IPizzaVariantService pizzaVariantService)
    {
        this.pizzaVariantService = pizzaVariantService;
    }

    public override void Configure()
    {
        Put("/api/admin/pizza-variants/{Id}");
        Roles("Admin");
    }

    public override async Task HandleAsync(PutAdminPizzaVariantRequest req, CancellationToken ct)
    {
        var command = new UpdatePizzaVariantCommand(
            req.Id,
            req.Name,
            req.Icon,
            req.SortOrder,
            req.IsAvailable
        );

        var result = await pizzaVariantService.UpdateAsync(command, ct);
        if (!result.IsSuccess)
        {
            if (result.Error is { } message)
                AddError(message);

            await SendFailureAsync(result.Status, ct);
            return;
        }

        await Send.OkAsync(
            new PutAdminPizzaVariantResponse(AdminPizzaVariantMapper.ToDto(result.Value)),
            cancellation: ct
        );
    }

    private async Task SendFailureAsync(ResultStatus status, CancellationToken ct)
    {
        switch (status)
        {
            case ResultStatus.NotFound:
                await Send.NotFoundAsync(ct);
                break;
            default:
                await Send.ErrorsAsync(cancellation: ct);
                break;
        }
    }
}
