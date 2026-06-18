import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  isPushSupported,
  registerServiceWorker,
  subscribeToPush,
  unsubscribeFromPush,
  urlBase64ToUint8Array,
} from "@/lib/push/push-browser";

// A minimal stand-in for the W3C PushSubscription returned by pushManager.subscribe().
const fakeSubscription = (endpoint: string): PushSubscription =>
  ({
    endpoint,
    expirationTime: null,
    toJSON: () => ({
      endpoint,
      expirationTime: null,
      keys: { p256dh: "p256dh-key", auth: "auth-secret" },
    }),
    unsubscribe: vi.fn().mockResolvedValue(true),
  }) as unknown as PushSubscription;

interface FakeEnvOptions {
  permission?: NotificationPermission;
  requestResult?: NotificationPermission;
  existing?: PushSubscription | null;
}

// Installs fake navigator.serviceWorker / Notification / window.PushManager onto
// the jsdom globals (jsdom ships none of them). Returns spies for assertions.
const installFakePushEnv = (options: FakeEnvOptions = {}) => {
  const subscribe = vi.fn(({ applicationServerKey }: PushSubscriptionOptionsInit) =>
    Promise.resolve(fakeSubscription(`https://push.example/${String(applicationServerKey)}`)),
  );
  const getSubscription = vi.fn().mockResolvedValue(options.existing ?? null);
  const register = vi.fn().mockResolvedValue({
    pushManager: { subscribe, getSubscription },
  });

  const requestPermission = vi
    .fn()
    .mockResolvedValue(options.requestResult ?? options.permission ?? "granted");

  vi.stubGlobal("navigator", {
    ...globalThis.navigator,
    serviceWorker: { register, ready: Promise.resolve({ pushManager: {} }) },
  });
  vi.stubGlobal("Notification", {
    permission: options.permission ?? "default",
    requestPermission,
  });
  // PushManager only needs to exist as a constructor for the support check.
  vi.stubGlobal("PushManager", class {});

  return { register, subscribe, getSubscription, requestPermission };
};

describe("isPushSupported", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("ist true, wenn serviceWorker, PushManager und Notification vorhanden sind", () => {
    installFakePushEnv();
    expect(isPushSupported()).toBe(true);
  });

  it("ist false, wenn PushManager fehlt (graceful degradation)", () => {
    vi.stubGlobal("navigator", { serviceWorker: {} });
    vi.stubGlobal("Notification", { permission: "default" });
    vi.stubGlobal("PushManager", undefined);
    expect(isPushSupported()).toBe(false);
  });

  it("ist false, wenn serviceWorker fehlt", () => {
    vi.stubGlobal("navigator", {});
    vi.stubGlobal("Notification", { permission: "default" });
    vi.stubGlobal("PushManager", class {});
    expect(isPushSupported()).toBe(false);
  });
});

describe("urlBase64ToUint8Array", () => {
  it("dekodiert einen URL-safe Base64 VAPID-Key in Bytes", () => {
    // "test" base64-url with no padding.
    const result = urlBase64ToUint8Array("dGVzdA");
    expect(result).toBeInstanceOf(Uint8Array);
    expect(Array.from(result)).toEqual([116, 101, 115, 116]);
  });
});

describe("registerServiceWorker", () => {
  beforeEach(() => {
    installFakePushEnv();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("registriert /sw.js und gibt die Registration zurück", async () => {
    const registration = await registerServiceWorker();
    expect(registration).not.toBeNull();
    expect(navigator.serviceWorker.register).toHaveBeenCalledWith("/sw.js", { scope: "/" });
  });

  it("gibt null zurück, wenn Push nicht unterstützt wird", async () => {
    vi.stubGlobal("navigator", {});
    vi.stubGlobal("PushManager", undefined);
    const registration = await registerServiceWorker();
    expect(registration).toBeNull();
  });
});

describe("subscribeToPush", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fordert die Berechtigung an und liefert die Subscription als JSON", async () => {
    const env = installFakePushEnv({ permission: "default", requestResult: "granted" });
    const registration = await registerServiceWorker();
    if (registration === null) {
      throw new Error("registration sollte vorhanden sein");
    }

    const result = await subscribeToPush({ registration, vapidPublicKey: "dGVzdA" });

    expect(env.requestPermission).toHaveBeenCalledTimes(1);
    expect(env.subscribe).toHaveBeenCalledWith(expect.objectContaining({ userVisibleOnly: true }));
    expect(result.status).toBe("subscribed");
    if (result.status !== "subscribed") {
      throw new Error("unerwarteter Status");
    }
    expect(result.subscription.endpoint).toMatch(/^https:\/\/push\.example\//);
    expect(result.subscription.keys.p256dh).toBe("p256dh-key");
    expect(result.subscription.keys.auth).toBe("auth-secret");
  });

  it("behandelt eine abgelehnte Berechtigung ohne zu werfen", async () => {
    const env = installFakePushEnv({ permission: "default", requestResult: "denied" });
    const registration = await registerServiceWorker();
    if (registration === null) {
      throw new Error("registration sollte vorhanden sein");
    }

    const result = await subscribeToPush({ registration, vapidPublicKey: "dGVzdA" });

    expect(result.status).toBe("denied");
    // Permission was denied => we must NOT have called pushManager.subscribe.
    expect(env.subscribe).not.toHaveBeenCalled();
  });
});

describe("unsubscribeFromPush", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("gibt den Endpoint der gekündigten Subscription zurück", async () => {
    const existing = fakeSubscription("https://push.example/existing");
    const env = installFakePushEnv({ existing });
    const registration = await registerServiceWorker();
    if (registration === null) {
      throw new Error("registration sollte vorhanden sein");
    }

    const endpoint = await unsubscribeFromPush(registration);

    expect(env.getSubscription).toHaveBeenCalledTimes(1);
    expect(endpoint).toBe("https://push.example/existing");
  });

  it("gibt null zurück, wenn keine Subscription existiert", async () => {
    installFakePushEnv({ existing: null });
    const registration = await registerServiceWorker();
    if (registration === null) {
      throw new Error("registration sollte vorhanden sein");
    }
    const endpoint = await unsubscribeFromPush(registration);
    expect(endpoint).toBeNull();
  });
});
