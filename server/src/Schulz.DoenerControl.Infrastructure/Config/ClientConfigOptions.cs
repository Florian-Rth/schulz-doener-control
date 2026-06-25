namespace Schulz.DoenerControl.Infrastructure.Config;

// Operational client configuration bound from app config. PwaGateEnabled toggles the PWA install
// gate; it defaults to false so a fresh or misconfigured deployment is never locked to PWA-only.
public sealed class ClientConfigOptions
{
    public const string PwaGateEnabledConfigKey = "Auth:PwaGateEnabled";

    public bool PwaGateEnabled { get; set; }
}
