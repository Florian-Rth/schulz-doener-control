import { useState } from "react";
import {
  currentPermission,
  isPushSupported,
  needsIosInstall,
  registerServiceWorker,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push";
import { useSubscribePush, useUnsubscribePush, useVapidPublicKey } from "../api";
import type { PushStatus } from "../types";

export interface PushOperations {
  status: PushStatus;
  /** True while the VAPID key / browser subscribe round-trip is in flight. */
  isBusy: boolean;
  subscribe: () => void;
  unsubscribe: () => void;
}

// Maps the static browser capability + permission into the initial card state.
const initialStatus = (): PushStatus => {
  // Check iOS-in-a-tab first: there the Push API is absent (so isPushSupported is
  // false), but the right guidance is "install to Home Screen", not "unsupported".
  if (needsIosInstall()) {
    return "ios-install";
  }
  if (!isPushSupported()) {
    return "unsupported";
  }
  const permission = currentPermission();
  if (permission === "denied") {
    return "denied";
  }
  if (permission === "granted") {
    return "subscribed";
  }
  return "default";
};

// Logic layer for the push-subscribe card. Owns the status machine and wires the
// browser Web Push calls (lib/push) to the backend subscription endpoints (api).
// Permission denial and unsupported browsers resolve to states, never throws.
export const usePushOperations = (): PushOperations => {
  const [status, setStatus] = useState<PushStatus>(initialStatus);
  const vapidQuery = useVapidPublicKey();
  const subscribeMutation = useSubscribePush();
  const unsubscribeMutation = useUnsubscribePush();

  const subscribe = (): void => {
    if (!isPushSupported()) {
      setStatus("unsupported");
      return;
    }
    setStatus("subscribing");
    void (async (): Promise<void> => {
      try {
        const vapid = vapidQuery.data ?? (await vapidQuery.refetch()).data;
        if (vapid === undefined) {
          setStatus("error");
          return;
        }
        const registration = await registerServiceWorker();
        if (registration === null) {
          setStatus("unsupported");
          return;
        }
        const result = await subscribeToPush({
          registration,
          vapidPublicKey: vapid.publicKey,
        });
        if (result.status === "denied") {
          setStatus("denied");
          return;
        }
        if (result.status === "unsupported") {
          setStatus("unsupported");
          return;
        }
        await subscribeMutation.mutateAsync(result.subscription);
        setStatus("subscribed");
      } catch {
        setStatus("error");
      }
    })();
  };

  const unsubscribe = (): void => {
    void (async (): Promise<void> => {
      try {
        const registration = await registerServiceWorker();
        if (registration === null) {
          setStatus("unsupported");
          return;
        }
        const endpoint = await unsubscribeFromPush(registration);
        if (endpoint !== null) {
          await unsubscribeMutation.mutateAsync(endpoint);
        }
        setStatus("default");
      } catch {
        setStatus("error");
      }
    })();
  };

  return {
    status,
    isBusy: status === "subscribing",
    subscribe,
    unsubscribe,
  };
};
