using FastEndpoints;
using Schulz.DoenerControl.Application.Config;

namespace Schulz.DoenerControl.Api.Endpoints.Config;

// The non-secret client config the SPA reads after authenticating, returned as the FE's
// ClientConfigSchema = { pwaGateEnabled }. The PWA install gate runs inside the authenticated app
// shell, so this endpoint stays authenticated like the other app endpoints — the SPA calls it with
// the session cookie. Reads through the service so the Api never touches ClientConfigOptions.
public sealed record GetClientConfigResponse(bool PwaGateEnabled);

public sealed class GetClientConfig : EndpointWithoutRequest<GetClientConfigResponse>
{
    private readonly IClientConfigService clientConfigService;

    public GetClientConfig(IClientConfigService clientConfigService)
    {
        this.clientConfigService = clientConfigService;
    }

    public override void Configure()
    {
        Get("/api/config");
    }

    public override async Task HandleAsync(CancellationToken ct)
    {
        var details = clientConfigService.GetClientConfig();
        var response = MapToResponse(details);
        await Send.OkAsync(response, cancellation: ct);
    }

    private static GetClientConfigResponse MapToResponse(ClientConfigDetails details) =>
        new(details.PwaGateEnabled);
}
