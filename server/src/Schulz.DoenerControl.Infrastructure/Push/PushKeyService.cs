using Microsoft.Extensions.Options;
using Schulz.DoenerControl.Application.Push;

namespace Schulz.DoenerControl.Infrastructure.Push;

// Reads the configured VAPID public key from the bound options so the API layer never touches
// VapidOptions directly. The key rarely rotates, so reading it per call is cheap.
public sealed class PushKeyService : IPushKeyService
{
    private readonly VapidOptions options;

    public PushKeyService(IOptions<VapidOptions> options)
    {
        this.options = options.Value;
    }

    public string GetPublicKey() => options.PublicKey;
}
