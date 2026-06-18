import { ThemeProvider } from "@mui/material/styles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PushSubscribeCard } from "@/features/push";
import { theme } from "@/styles/theme";
import { mswServer } from "@/test/mswServer";

// Seeds the CSRF cookie the apiClient echoes on the POST/DELETE mutations.
const seedXsrfCookie = (): void => {
  // biome-ignore lint/suspicious/noDocumentCookie: seeding the CSRF cookie the apiClient reads; Cookie Store API is unavailable in jsdom
  document.cookie = "dc_xsrf=test-token";
};

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
}

const installFakePushEnv = (options: FakeEnvOptions = {}) => {
  const subscribe = vi.fn().mockResolvedValue(fakeSubscription("https://push.example/sub-1"));
  const getSubscription = vi.fn().mockResolvedValue(null);
  const register = vi.fn().mockResolvedValue({
    pushManager: { subscribe, getSubscription },
  });
  const requestPermission = vi.fn().mockResolvedValue(options.requestResult ?? "granted");

  // Spread the real navigator so userEvent / jsdom keep their other props
  // (userAgent, clipboard, …); we only add the serviceWorker capability.
  vi.stubGlobal("navigator", { ...globalThis.navigator, serviceWorker: { register } });
  vi.stubGlobal("Notification", {
    permission: options.permission ?? "default",
    requestPermission,
  });
  vi.stubGlobal("PushManager", class {});

  return { register, subscribe, getSubscription, requestPermission };
};

const renderCard = (ui: ReactElement): ReturnType<typeof render> => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>{ui}</ThemeProvider>
    </QueryClientProvider>,
  );
};

describe("PushSubscribeCard", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fragt die Berechtigung an und POSTet die Subscription bei Erfolg", async () => {
    seedXsrfCookie();
    const env = installFakePushEnv({ permission: "default", requestResult: "granted" });
    let postedBody: unknown = null;
    mswServer.use(
      http.get("*/api/push/vapid-public-key", () => HttpResponse.json({ publicKey: "dGVzdA" })),
      http.post("*/api/push/subscriptions", async ({ request }) => {
        postedBody = await request.json();
        return HttpResponse.json({ endpoint: "https://push.example/sub-1" });
      }),
    );
    const user = userEvent.setup();
    const { findByRole, findByText } = renderCard(<PushSubscribeCard />);

    await user.click(await findByRole("button", { name: /Push aktivieren/i }));

    // Permission was requested and the subscription posted to the backend.
    await waitFor(() => {
      expect(env.requestPermission).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(postedBody).toEqual({
        endpoint: "https://push.example/sub-1",
        expirationTime: null,
        keys: { p256dh: "p256dh-key", auth: "auth-secret" },
      });
    });
    expect(await findByText(/Push ist aktiv/i)).toBeInTheDocument();
    expect(env.register).toHaveBeenCalledWith("/sw.js", { scope: "/" });
  });

  it("zeigt den Blockiert-Hinweis ohne zu werfen, wenn die Berechtigung abgelehnt wird", async () => {
    const env = installFakePushEnv({ permission: "default", requestResult: "denied" });
    let postCount = 0;
    mswServer.use(
      http.get("*/api/push/vapid-public-key", () => HttpResponse.json({ publicKey: "dGVzdA" })),
      http.post("*/api/push/subscriptions", () => {
        postCount += 1;
        return HttpResponse.json({ endpoint: "x" });
      }),
    );
    const user = userEvent.setup();
    const { findByRole, findByText } = renderCard(<PushSubscribeCard />);

    await user.click(await findByRole("button", { name: /Push aktivieren/i }));

    expect(await findByText(/blockiert/i)).toBeInTheDocument();
    // No subscription is created or posted on a denial.
    expect(env.subscribe).not.toHaveBeenCalled();
    expect(postCount).toBe(0);
  });

  it("zeigt den Nicht-unterstützt-Hinweis, wenn der Browser kein Push kann", async () => {
    // jsdom's navigator has no serviceWorker; with PushManager/Notification
    // also absent, isPushSupported() is false.
    vi.stubGlobal("PushManager", undefined);
    vi.stubGlobal("Notification", undefined);

    const { findByText } = renderCard(<PushSubscribeCard />);

    expect(await findByText(/nicht unterstützt/i)).toBeInTheDocument();
  });
});
