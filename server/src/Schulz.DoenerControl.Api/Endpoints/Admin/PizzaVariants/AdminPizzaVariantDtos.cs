using Schulz.DoenerControl.Application.PizzaVariants;

namespace Schulz.DoenerControl.Api.Endpoints.Admin.PizzaVariants;

// Endpoint-layer projection of one pizza variant for the admin management screen, shared by the
// list, create and update responses. Mapped from the Application PizzaVariantDetails so the service
// type never leaks across the boundary.
public sealed record AdminPizzaVariantDto(
    Guid Id,
    string Name,
    string? Icon,
    int SortOrder,
    bool IsAvailable
);

public static class AdminPizzaVariantMapper
{
    public static AdminPizzaVariantDto ToDto(PizzaVariantDetails details) =>
        new(details.Id, details.Name, details.Icon, details.SortOrder, details.IsAvailable);
}
