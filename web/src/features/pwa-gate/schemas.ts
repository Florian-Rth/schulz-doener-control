import { z } from "zod";

// GET /api/config — the non-secret client config the SPA reads after authenticating.
// pwaGateEnabled is the kill-switch for the PWA install gate.
export const ClientConfigSchema = z.object({
  pwaGateEnabled: z.boolean(),
});

// The developer bypass query param: ?debug=<token> lets the app run in a browser tab. Validated at
// the boundary; the hook compares the value against the known token rather than trusting presence.
export const GateSearchSchema = z.object({
  debug: z.string().optional(),
});
