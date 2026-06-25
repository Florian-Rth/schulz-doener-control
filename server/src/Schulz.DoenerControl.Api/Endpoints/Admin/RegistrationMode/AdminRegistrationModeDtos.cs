using Schulz.DoenerControl.Application.Config;

namespace Schulz.DoenerControl.Api.Endpoints.Admin.RegistrationMode;

// Endpoint-layer projection of the self-registration policy for the admin screen, shared by the GET
// and PUT responses. mode is the int wire value (1 Enabled / 2 Disabled / 3 SecretKeyOnly); secretKey
// is null when none is set. Mapped from the Application RegistrationModeDetails so the service type
// never leaks across the boundary.
public sealed record AdminRegistrationModeDto(int Mode, string? SecretKey);

public static class AdminRegistrationModeMapper
{
    public static AdminRegistrationModeDto ToDto(RegistrationModeDetails details) =>
        new((int)details.Mode, details.SecretKey);
}
