using Microsoft.Extensions.Options;
using Schulz.DoenerControl.Application.Config;

namespace Schulz.DoenerControl.Infrastructure.Config;

// Reads the bound client configuration so the API layer never touches ClientConfigOptions directly.
// The flags rarely change, so reading them per call is cheap — same shape as PushKeyService.
public sealed class ClientConfigService : IClientConfigService
{
    private readonly ClientConfigOptions options;

    public ClientConfigService(IOptions<ClientConfigOptions> options)
    {
        this.options = options.Value;
    }

    public ClientConfigDetails GetClientConfig() => new(options.PwaGateEnabled);
}
