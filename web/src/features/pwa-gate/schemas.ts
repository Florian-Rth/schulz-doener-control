import { z } from "zod";

// The self-registration mode the backend governs (client-config `registrationMode`):
//  1 Enabled       — anyone may register (the default).
//  2 Disabled      — registration is off; the login screen hides the register link.
//  3 SecretKeyOnly — registration requires the shared secret key (carried in the QR-code URL).
export const RegistrationMode = {
  Enabled: 1,
  Disabled: 2,
  SecretKeyOnly: 3,
} as const;

export type RegistrationModeValue = (typeof RegistrationMode)[keyof typeof RegistrationMode];

// GET /api/config — the non-secret client config the SPA reads after authenticating.
// pwaGateEnabled is the kill-switch for the PWA install gate. registrationMode is the
// self-registration policy; it is optional on the wire (older servers / anonymous reads may omit
// it) and defaults to Enabled so the register flow is never accidentally locked out (fail-open).
export const ClientConfigSchema = z.object({
  pwaGateEnabled: z.boolean(),
  registrationMode: z
    .union([z.literal(1), z.literal(2), z.literal(3)])
    .default(RegistrationMode.Enabled),
});

// The developer bypass query param: ?debug=<token> lets the app run in a browser tab. Validated at
// the boundary; the hook compares the value against the known token rather than trusting presence.
export const GateSearchSchema = z.object({
  debug: z.string().optional(),
});
