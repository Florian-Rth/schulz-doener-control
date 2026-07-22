using Schulz.DoenerControl.Application.Categories;

namespace Schulz.DoenerControl.Api.Endpoints.Admin.Categories;

// Endpoint-layer projection of one food category for the admin management screen, shared by the list,
// create, update and set-fields responses. Carries the ordered field links so the admin sees which
// fields the category exposes. Mapped from the Application CategoryDetails so the service type never
// leaks across the boundary.
public sealed record AdminCategorySummaryDto(
    string Key,
    string Name,
    int SortOrder,
    bool IsAvailable,
    IReadOnlyList<CategoryFieldLinkDto> Fields
);

public sealed record CategoryFieldLinkDto(string FieldKey, int SortOrder, bool IsRequired);

public static class AdminCategoryMapper
{
    public static AdminCategorySummaryDto ToDto(CategoryDetails details) =>
        new(
            details.Key,
            details.Name,
            details.SortOrder,
            details.IsAvailable,
            details
                .Fields.Select(link => new CategoryFieldLinkDto(
                    link.FieldKey,
                    link.SortOrder,
                    link.IsRequired
                ))
                .ToList()
        );
}
