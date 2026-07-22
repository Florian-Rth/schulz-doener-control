using Schulz.DoenerControl.Application.Fields;

namespace Schulz.DoenerControl.Api.Endpoints.Admin.Fields;

// Endpoint-layer projection of one field definition (with all its options, available and retired) for
// the admin management screen, shared by the list, create, update and option responses. Type/Display
// are the lowercase wire tokens. Mapped from the Application FieldDetails so the service type never
// leaks across the boundary.
public sealed record AdminFieldDetailsDto(
    string Key,
    string Label,
    string Type,
    string Display,
    int? MaxLength,
    IReadOnlyList<AdminFieldOptionDto> Options
);

public sealed record AdminFieldOptionDto(
    string Key,
    string Label,
    string? Icon,
    int PriceDeltaCents,
    int SortOrder,
    bool IsAvailable
);

public static class AdminFieldMapper
{
    public static AdminFieldDetailsDto ToDto(FieldDetails details) =>
        new(
            details.Key,
            details.Label,
            details.Type,
            details.Display,
            details.MaxLength,
            details
                .Options.Select(option => new AdminFieldOptionDto(
                    option.Key,
                    option.Label,
                    option.Icon,
                    option.PriceDeltaCents,
                    option.SortOrder,
                    option.IsAvailable
                ))
                .ToList()
        );
}
