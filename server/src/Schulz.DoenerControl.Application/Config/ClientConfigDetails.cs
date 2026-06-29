namespace Schulz.DoenerControl.Application.Config;

// The non-secret client configuration the SPA reads after authenticating. PwaGateEnabled is the
// operational kill-switch for the PWA install gate: when false the app is reachable in any browser.
// EmailPdfEnabled mirrors the SMTP kill-switch so the print view can hide its "mail the list" button
// when mail-send isn't configured.
public sealed record ClientConfigDetails(bool PwaGateEnabled, bool EmailPdfEnabled);
