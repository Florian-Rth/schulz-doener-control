import { ThemeProvider } from "@mui/material/styles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render } from "@testing-library/react";
import { delay, HttpResponse, http } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isStandalonePwa } from "@/lib/push";
import { theme } from "@/styles/theme";
import { mswServer } from "@/test/mswServer";
import { PwaGate } from "./PwaGate";

// isStandalonePwa is the one browser signal we drive per test; everything else (detectInstallPlatform
// for the guide, the install-prompt store) stays real.
vi.mock("@/lib/push", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/push")>();
  return { ...actual, isStandalonePwa: vi.fn(() => false) };
});

const APP_CONTENT = "APP CONTENT";
const GUIDE_TITLE = "So installierst du die App";

const gateConfig = (pwaGateEnabled: boolean): void => {
  mswServer.use(http.get("*/api/config", () => HttpResponse.json({ pwaGateEnabled })));
};

// Mounts <PwaGate> at the router root so the gate reads a real location (pathname + search) and the
// React Query config fetch, exactly as it runs under /_auth. The gated children are a marker.
const renderGate = (initialPath: string): ReturnType<typeof render> => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const rootRoute = createRootRoute({
    component: () => (
      <PwaGate>
        <div>{APP_CONTENT}</div>
      </PwaGate>
    ),
  });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => null,
  });
  const changePasswordRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/passwort-aendern",
    component: () => null,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, changePasswordRoute]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryClientProvider>,
  );
};

describe("PwaGate", () => {
  beforeEach(() => {
    vi.mocked(isStandalonePwa).mockReturnValue(false);
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("lässt die App durch, wenn das Gate deaktiviert ist", async () => {
    gateConfig(false);
    const { findByText } = renderGate("/");
    expect(await findByText(APP_CONTENT)).toBeInTheDocument();
  });

  it("zeigt im Browser-Tab den Install-Guide, wenn das Gate aktiv ist", async () => {
    gateConfig(true);
    const { findByText } = renderGate("/");
    expect(await findByText(GUIDE_TITLE)).toBeInTheDocument();
  });

  it("lässt die installierte PWA durch", async () => {
    vi.mocked(isStandalonePwa).mockReturnValue(true);
    gateConfig(true);
    const { findByText } = renderGate("/");
    expect(await findByText(APP_CONTENT)).toBeInTheDocument();
  });

  it("lässt den Debug-Bypass per ?debug-Token durch", async () => {
    gateConfig(true);
    const { findByText } = renderGate("/?debug=doener");
    expect(await findByText(APP_CONTENT)).toBeInTheDocument();
  });

  it("merkt sich den Bypass aus localStorage über Navigationen hinweg", async () => {
    window.localStorage.setItem("dc_pwa_bypass", "1");
    gateConfig(true);
    const { findByText } = renderGate("/");
    expect(await findByText(APP_CONTENT)).toBeInTheDocument();
  });

  it("nimmt /passwort-aendern vom Gate aus, damit der Login-Flow im Browser klappt", async () => {
    gateConfig(true);
    const { findByText } = renderGate("/passwort-aendern");
    expect(await findByText(APP_CONTENT)).toBeInTheDocument();
  });

  it("zeigt einen Splash, solange die Gate-Konfiguration lädt", async () => {
    mswServer.use(
      http.get("*/api/config", async () => {
        await delay("infinite");
        return HttpResponse.json({ pwaGateEnabled: true });
      }),
    );
    const { findByRole } = renderGate("/");
    expect(await findByRole("progressbar")).toBeInTheDocument();
  });
});
