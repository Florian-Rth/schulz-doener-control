using FastEndpoints;
using Schulz.DoenerControl.Application.Config;

namespace Schulz.DoenerControl.Api.Endpoints.Config;

// The non-secret client config the SPA reads, returned as the FE's
// ClientConfigSchema = { pwaGateEnabled, registrationMode }. Anonymous: the pre-login register/login
// page must read registrationMode to react to the self-registration policy (hide the register link
// on Disabled, require the secret key on SecretKeyOnly), so the gate cannot be locked out before the
// user has a session. Both fields are non-sensitive feature flags — RegistrationMode is the int wire
// value (1 Enabled / 2 Disabled / 3 SecretKeyOnly) and the secret key itself is never exposed here.
// Reads through services so the Api never touches ClientConfigOptions or the RegistrationMode entity.
public sealed record GetClientConfigResponse(
    bool PwaGateEnabled,
    int RegistrationMode,
    bool EmailPdfEnabled
);

public sealed class GetClientConfig : EndpointWithoutRequest<GetClientConfigResponse>
{
    private readonly IClientConfigService clientConfigService;
    private readonly IRegistrationModeService registrationModeService;

    public GetClientConfig(
        IClientConfigService clientConfigService,
        IRegistrationModeService registrationModeService
    )
    {
        this.clientConfigService = clientConfigService;
        this.registrationModeService = registrationModeService;
    }

    public override void Configure()
    {
        Get("/api/config");
        AllowAnonymous();
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var details = clientConfigService.GetClientConfig();
        var registration = await registrationModeService.GetModeAsync(ct);
        var response = new GetClientConfigResponse(
            details.PwaGateEnabled,
            (int)registration.Mode,
            details.EmailPdfEnabled
        );
        await Send.OkAsync(response, cancellation: ct);
    }
}
