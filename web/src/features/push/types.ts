import type { z } from "zod";
import type {
  PushSubscriptionPayloadSchema,
  PushSubscriptionResponseSchema,
  VapidPublicKeySchema,
} from "./schemas";

export type VapidPublicKey = z.infer<typeof VapidPublicKeySchema>;
export type PushSubscriptionResponse = z.infer<typeof PushSubscriptionResponseSchema>;
export type PushSubscriptionPayload = z.infer<typeof PushSubscriptionPayloadSchema>;

// The user-facing state of the push-subscribe flow. Drives which copy + control
// the card renders. "unsupported"/"denied" are the graceful-degradation states.
export type PushStatus =
  | "unsupported"
  | "default"
  | "denied"
  | "subscribing"
  | "subscribed"
  | "error";
