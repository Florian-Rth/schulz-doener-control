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
// the card renders. "unsupported"/"denied"/"ios-install" are the graceful-
// degradation states. "ios-install" = an iPhone/iPad in a browser tab, where push
// only works once the app is added to the Home Screen.
export type PushStatus =
  | "unsupported"
  | "ios-install"
  | "default"
  | "denied"
  | "subscribing"
  | "subscribed"
  | "error";
