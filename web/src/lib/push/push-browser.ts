// Thin, framework-agnostic wrapper around the browser Web Push APIs
// (Service Worker + Push API + Notifications). Kept out of React so the
// permission/subscribe/unsubscribe logic is unit-testable by stubbing the
// browser globals (jsdom ships none of them). Feature hooks call into this.

const SERVICE_WORKER_URL = "/sw.js";

// The W3C PushSubscription.toJSON() shape the backend stores verbatim
// (POST /api/push/subscriptions). Standard wire format for any web-push library.
export interface PushSubscriptionPayload {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export type SubscribeResult =
  | { status: "subscribed"; subscription: PushSubscriptionPayload }
  | { status: "denied" }
  | { status: "unsupported" };

// Feature detection — every required capability must be present, otherwise we
// degrade gracefully (no SW registration, the UI shows an unsupported notice).
export const isPushSupported = (): boolean => {
  return (
    typeof navigator !== "undefined" &&
    "serviceWorker" in navigator &&
    typeof PushManager !== "undefined" &&
    typeof Notification !== "undefined"
  );
};

// Converts a URL-safe base64 VAPID public key into the Uint8Array the Push API
// `applicationServerKey` option requires.
export const urlBase64ToUint8Array = (base64String: string): Uint8Array<ArrayBuffer> => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  // Backed by a concrete ArrayBuffer (not ArrayBufferLike) so the result
  // satisfies the BufferSource the Push API `applicationServerKey` expects.
  const output = new Uint8Array(new ArrayBuffer(rawData.length));
  for (let i = 0; i < rawData.length; i += 1) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
};

// Registers the service worker at the site root. Returns null when push is
// unsupported so callers never branch on a thrown error.
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!isPushSupported()) {
    return null;
  }
  return navigator.serviceWorker.register(SERVICE_WORKER_URL, { scope: "/" });
};

const toPayload = (subscription: PushSubscription): PushSubscriptionPayload => {
  // PushSubscription.toJSON() yields { endpoint, expirationTime, keys{p256dh,auth} }.
  const json = subscription.toJSON();
  return {
    endpoint: json.endpoint ?? subscription.endpoint,
    expirationTime: json.expirationTime ?? null,
    keys: {
      p256dh: json.keys?.p256dh ?? "",
      auth: json.keys?.auth ?? "",
    },
  };
};

interface SubscribeArgs {
  registration: ServiceWorkerRegistration;
  vapidPublicKey: string;
}

// Requests notification permission, and on grant subscribes via the Push API.
// A denied/dismissed permission resolves to a { status: "denied" } result
// rather than throwing — graceful degradation is a first-class outcome.
export const subscribeToPush = async ({
  registration,
  vapidPublicKey,
}: SubscribeArgs): Promise<SubscribeResult> => {
  if (!isPushSupported()) {
    return { status: "unsupported" };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { status: "denied" };
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  });

  return { status: "subscribed", subscription: toPayload(subscription) };
};

// Cancels the active subscription (if any) and returns its endpoint so the
// caller can tell the backend which row to drop. Null when nothing was active.
export const unsubscribeFromPush = async (
  registration: ServiceWorkerRegistration,
): Promise<string | null> => {
  const existing = await registration.pushManager.getSubscription();
  if (existing === null) {
    return null;
  }
  const { endpoint } = existing;
  await existing.unsubscribe();
  return endpoint;
};

// Reads the current notification permission, defaulting to "default" when the
// Notification API is unavailable (so the UI can render a sensible state).
export const currentPermission = (): NotificationPermission => {
  if (typeof Notification === "undefined") {
    return "default";
  }
  return Notification.permission;
};

declare global {
  interface Navigator {
    // Legacy iOS-only flag: true when the page is launched from the Home Screen.
    readonly standalone?: boolean;
  }
}

// iOS (incl. iPadOS) exposes the Push API only inside a Home-Screen-installed PWA,
// never in a normal Safari tab. Detecting an iPhone/iPad lets the UI guide the
// user to install instead of showing a dead "unsupported" notice.
export const isIosDevice = (): boolean => {
  if (typeof navigator === "undefined") {
    return false;
  }
  const ua = navigator.userAgent;
  // iPadOS 13+ reports a desktop-Mac user agent, so fall back to the touch hint.
  const isIPadOs = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  return /iPad|iPhone|iPod/.test(ua) || isIPadOs;
};

// True when the app runs as an installed standalone PWA (Home Screen launch).
export const isStandalonePwa = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }
  const displayModeStandalone =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(display-mode: standalone)").matches;
  return displayModeStandalone || navigator.standalone === true;
};

// True on an iPhone/iPad opened in a browser tab (not yet installed): Web Push is
// unavailable here and only works once the app is added to the Home Screen.
export const needsIosInstall = (): boolean => isIosDevice() && !isStandalonePwa();

// The install-guide platforms whose "add to Home Screen" / "install app" steps differ.
export type InstallPlatform = "ios" | "android" | "desktop";

// Classifies the device so the install guide shows the right steps. iOS first (isIosDevice also
// covers iPadOS's desktop-Mac user agent), then Android, otherwise desktop.
export const detectInstallPlatform = (): InstallPlatform => {
  if (isIosDevice()) {
    return "ios";
  }
  if (typeof navigator !== "undefined" && /Android/.test(navigator.userAgent)) {
    return "android";
  }
  return "desktop";
};
