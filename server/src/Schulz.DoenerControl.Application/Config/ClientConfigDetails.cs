namespace Schulz.DoenerControl.Application.Config;

// The non-secret client configuration the SPA reads after authenticating. PwaGateEnabled is the
// operational kill-switch for the PWA install gate: when false the app is reachable in any browser.
public sealed record ClientConfigDetails(bool PwaGateEnabled);
