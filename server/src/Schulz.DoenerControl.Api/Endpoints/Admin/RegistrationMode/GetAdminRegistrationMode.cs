using FastEndpoints;
using Schulz.DoenerControl.Application.Config;

namespace Schulz.DoenerControl.Api.Endpoints.Admin.RegistrationMode;

// Returns the current self-registration policy and its configured secret key for the admin screen.
// Operates on the singleton row, so no id is needed in the route. Admin-only.
public sealed class GetAdminRegistrationMode : EndpointWithoutRequest<AdminRegistrationModeDto>
{
    private readonly IRegistrationModeService registrationModeService;

    public GetAdminRegistrationMode(IRegistrationModeService registrationModeService)
    {
        this.registrationModeService = registrationModeService;
    }

    public override void Configure()
    {
        Get("/api/admin/registration-mode");
        Roles("Admin");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var details = await registrationModeService.GetModeAsync(ct);
        await Send.OkAsync(AdminRegistrationModeMapper.ToDto(details), cancellation: ct);
    }
}
