import { z } from "zod";

// GET /api/push/vapid-public-key — the server's VAPID public key (URL-safe
// base64). The browser needs it as the `applicationServerKey` when subscribing.
export const VapidPublicKeySchema = z.object({
  publicKey: z.string().min(1),
});

// POST /api/push/subscriptions response — the persisted subscription id/endpoint.
// The body we send is the raw W3C PushSubscription JSON (validated below).
export const PushSubscriptionResponseSchema = z.object({
  endpoint: z.string().min(1),
});

// The W3C PushSubscription.toJSON() shape we POST to the backend verbatim.
export const PushSubscriptionPayloadSchema = z.object({
  endpoint: z.string().min(1),
  expirationTime: z.number().nullable(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});
