using FastEndpoints;
using Schulz.DoenerControl.Application.Fields;

namespace Schulz.DoenerControl.Api.Endpoints.Admin.Fields;

public sealed record GetAdminFieldsResponse(IReadOnlyList<AdminFieldDetailsDto> Items);

// Lists every field definition of the active store, each with all its options (available and
// retired), for the admin menu-management screen. Admin-only.
public sealed class GetAdminFields : EndpointWithoutRequest<GetAdminFieldsResponse>
{
    private readonly IFieldService fieldService;

    public GetAdminFields(IFieldService fieldService)
    {
        this.fieldService = fieldService;
    }

    public override void Configure()
    {
        Get("/api/admin/fields");
        Roles("Admin");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var result = await fieldService.ListAllAsync(ct);
        var items = result.Value.Select(AdminFieldMapper.ToDto).ToList();
        await Send.OkAsync(new GetAdminFieldsResponse(items), cancellation: ct);
    }
}
