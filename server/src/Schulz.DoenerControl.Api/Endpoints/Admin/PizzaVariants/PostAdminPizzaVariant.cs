using FastEndpoints;
using FluentValidation;
using Schulz.DoenerControl.Application.PizzaVariants;
using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Api.Endpoints.Admin.PizzaVariants;

public sealed record PostAdminPizzaVariantRequest(
    string Name,
    string? Icon,
    int SortOrder,
    bool IsAvailable
);

public sealed record PostAdminPizzaVariantResponse(AdminPizzaVariantDto Item);

public sealed class PostAdminPizzaVariantRequestValidator : Validator<PostAdminPizzaVariantRequest>
{
    public PostAdminPizzaVariantRequestValidator()
    {
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

// Creates a new pizza variant. The service assigns the id. Admin-only.
public sealed class PostAdminPizzaVariant
    : Endpoint<PostAdminPizzaVariantRequest, PostAdminPizzaVariantResponse>
{
    private readonly IPizzaVariantService pizzaVariantService;

    public PostAdminPizzaVariant(IPizzaVariantService pizzaVariantService)
    {
        this.pizzaVariantService = pizzaVariantService;
    }

    public override void Configure()
    {
        Post("/api/admin/pizza-variants");
        Roles("Admin");
    }

    public override async Task HandleAsync(PostAdminPizzaVariantRequest req, CancellationToken ct)
    {
        var command = new CreatePizzaVariantCommand(
            req.Name,
            req.Icon,
            req.SortOrder,
            req.IsAvailable
        );

        var result = await pizzaVariantService.CreateAsync(command, ct);
        if (!result.IsSuccess)
        {
            if (result.Error is { } message)
                AddError(message);

            await SendFailureAsync(result.Status, ct);
            return;
        }

        await Send.CreatedAtAsync<GetAdminPizzaVariants>(
            routeValues: null,
            responseBody: new PostAdminPizzaVariantResponse(
                AdminPizzaVariantMapper.ToDto(result.Value)
            ),
            generateAbsoluteUrl: false,
            cancellation: ct
        );
    }

    private async Task SendFailureAsync(ResultStatus status, CancellationToken ct)
    {
        switch (status)
        {
            case ResultStatus.Conflict:
                await Send.ErrorsAsync(StatusCodes.Status409Conflict, cancellation: ct);
                break;
            default:
                await Send.ErrorsAsync(cancellation: ct);
                break;
        }
    }
}
