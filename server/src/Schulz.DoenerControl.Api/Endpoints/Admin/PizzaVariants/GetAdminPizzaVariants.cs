using FastEndpoints;
using Schulz.DoenerControl.Application.PizzaVariants;

namespace Schulz.DoenerControl.Api.Endpoints.Admin.PizzaVariants;

public sealed record GetAdminPizzaVariantsResponse(IReadOnlyList<AdminPizzaVariantDto> Items);

// Lists every pizza variant including retired (unavailable) ones for the admin management screen,
// sorted by SortOrder. Admin-only.
public sealed class GetAdminPizzaVariants : EndpointWithoutRequest<GetAdminPizzaVariantsResponse>
{
    private readonly IPizzaVariantService pizzaVariantService;

    public GetAdminPizzaVariants(IPizzaVariantService pizzaVariantService)
    {
        this.pizzaVariantService = pizzaVariantService;
    }

    public override void Configure()
    {
        Get("/api/admin/pizza-variants");
        Roles("Admin");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var result = await pizzaVariantService.ListAllAsync(ct);
        var items = result.Value.Select(AdminPizzaVariantMapper.ToDto).ToList();
        await Send.OkAsync(new GetAdminPizzaVariantsResponse(items), cancellation: ct);
    }
}
