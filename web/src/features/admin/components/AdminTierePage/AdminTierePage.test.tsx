import { ThemeProvider } from "@mui/material/styles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { AdminTierePage } from "@/features/admin";
import { theme } from "@/styles/theme";
import { mswServer } from "@/test/mswServer";

// Two representative tiers in priority order; the response shape mirrors
// GET /api/admin/tiere (windowDays + the tiers array with emoji/name/tagline/
// tags/condition).
const tiereResponse = {
  windowDays: 90,
  tiers: [
    {
      emoji: "🐺",
      name: "Der Knoblauch-Wolf",
      tagline: "Extra Knobi ist Pflicht.",
      tags: ["Knoblauch", "Treue", "Wolf"],
      condition: "Bei mindestens 80 % der Bestellungen extra Knoblauch.",
    },
    {
      emoji: "🐉",
      name: "Der Schärfe-Drache",
      tagline: "Je schärfer, desto besser.",
      tags: ["Schärfe", "Mut", "Feuer"],
      condition: "Wählt durchgängig die schärfste verfügbare Soße.",
    },
  ],
};

// The page calls `useNavigate`, so it must be mounted inside a router. A minimal
// memory router with the page at the index route plus a stub /admin route
// satisfies the back navigation without pulling in the auth guards.
const renderPage = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: AdminTierePage,
  });
  const adminRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/admin",
    component: () => null,
  });
  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, adminRoute]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  const utils = render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryClientProvider>,
  );
  return { ...utils, router };
};

describe("AdminTierePage", () => {
  it("rendert alle Tiere mit ihrer Bedingung und zeigt die Fenster-Basis", async () => {
    mswServer.use(http.get("*/api/admin/tiere", () => HttpResponse.json(tiereResponse)));
    const { findByText } = renderPage();

    // Both tiers render with name + condition text.
    expect(await findByText("Der Knoblauch-Wolf")).toBeInTheDocument();
    expect(
      await findByText("Bei mindestens 80 % der Bestellungen extra Knoblauch."),
    ).toBeInTheDocument();
    expect(await findByText("Der Schärfe-Drache")).toBeInTheDocument();
    expect(
      await findByText("Wählt durchgängig die schärfste verfügbare Soße."),
    ).toBeInTheDocument();

    // A descriptor tag from the first tier renders.
    expect(await findByText("Knoblauch")).toBeInTheDocument();

    // The window basis is surfaced with the returned windowDays.
    expect(await findByText("Berechnet über die letzten 90 Tage, Chef.")).toBeInTheDocument();
  });

  it("zeigt eine Fehlermeldung, wenn das Laden scheitert", async () => {
    mswServer.use(
      http.get("*/api/admin/tiere", () => HttpResponse.json({ title: "Fehler" }, { status: 500 })),
    );
    const { findByText } = renderPage();

    expect(await findByText(/konnten nicht geladen werden/i)).toBeInTheDocument();
  });

  it("navigiert über den Zurück-Knopf zurück zum Admin-Hub", async () => {
    mswServer.use(http.get("*/api/admin/tiere", () => HttpResponse.json(tiereResponse)));
    const user = userEvent.setup();
    const { findByRole, router } = renderPage();

    await user.click(await findByRole("button", { name: "Zurück" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/admin");
    });
  });
});
