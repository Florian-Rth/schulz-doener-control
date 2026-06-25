namespace Schulz.DoenerControl.Application.Config;

// Exposes the non-secret client configuration to the API layer without leaking the Infrastructure
// options binding across the service boundary, mirroring how IPushKeyService hides VapidOptions.
public interface IClientConfigService
{
    ClientConfigDetails GetClientConfig();
}
