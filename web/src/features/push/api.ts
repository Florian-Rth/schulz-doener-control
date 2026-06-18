import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import type { PushSubscriptionPayload } from "@/lib/push";
import { PushSubscriptionResponseSchema, VapidPublicKeySchema } from "./schemas";
import type { PushSubscriptionResponse, VapidPublicKey } from "./types";

export const pushKeys = {
  vapidPublicKey: ["push", "vapid-public-key"] as const,
};

const fetchVapidPublicKey = async (signal: AbortSignal): Promise<VapidPublicKey> => {
  const data = await apiClient.get("/api/push/vapid-public-key", signal);
  return VapidPublicKeySchema.parse(data);
};

// Loads the server VAPID public key. Lives long (the key rarely rotates) so the
// staleTime is generous; the browser needs it before it can subscribe.
export const useVapidPublicKey = () => {
  return useQuery({
    queryKey: pushKeys.vapidPublicKey,
    queryFn: ({ signal }) => fetchVapidPublicKey(signal),
    staleTime: Number.POSITIVE_INFINITY,
  });
};

const postSubscription = async (
  payload: PushSubscriptionPayload,
): Promise<PushSubscriptionResponse> => {
  // Send as a fresh JSON object (the W3C PushSubscription wire shape) so the
  // backend stores endpoint + keys verbatim for its web-push sender.
  const data = await apiClient.post("/api/push/subscriptions", {
    endpoint: payload.endpoint,
    expirationTime: payload.expirationTime,
    keys: { p256dh: payload.keys.p256dh, auth: payload.keys.auth },
  });
  return PushSubscriptionResponseSchema.parse(data);
};

// Persists a freshly created browser subscription on the backend so OpenDay can
// fan a web push out to it.
export const useSubscribePush = () => {
  return useMutation({
    mutationFn: postSubscription,
  });
};

const deleteSubscription = async (endpoint: string): Promise<void> => {
  await apiClient.delete(`/api/push/subscriptions?endpoint=${encodeURIComponent(endpoint)}`);
};

// Drops the subscription row on the backend (paired with the browser-side
// pushManager.unsubscribe()).
export const useUnsubscribePush = () => {
  return useMutation({
    mutationFn: deleteSubscription,
  });
};
