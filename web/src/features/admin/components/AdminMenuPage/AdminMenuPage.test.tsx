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
import { AdminMenuPage } from "@/features/admin";
import { theme } from "@/styles/theme";
import { mswServer } from "@/test/mswServer";

// Seeds the CSRF cookie the apiClient echoes on every mutating request.
const seedXsrfCookie = (): void => {
  // biome-ignore lint/suspicious/noDocumentCookie: seeding the CSRF cookie the apiClient reads; Cookie Store API is unavailable in jsdom
  document.cookie = "dc_xsrf=test-token";
};

const menuRow = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: "duerum-kalb",
  name: "Dürüm Kalb",
  defaultPriceCents: 850,
  defaultPriceLabel: "8,50 €",
  kind: "doener",
  materialIcon: "kebab_dining",
  note: null,
  isInsider: false,
  sortOrder: 1,
  isAvailable: true,
  ...overrides,
});

// The page calls `useNavigate`, so it must be mounted inside a router. A minimal
// memory router with the page at the index route satisfies that without pulling
// in the full app tree / auth guards.
const renderPage = (): ReturnType<typeof render> => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: AdminMenuPage,
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
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryClientProvider>,
  );
};

describe("AdminMenuPage", () => {
  it("rendert die Karte und markiert nicht verfügbare Gerichte", async () => {
    mswServer.use(
      http.get("*/api/admin/menu", () =>
        HttpResponse.json({
          items: [
            menuRow(),
            menuRow({
              id: "pizza-salami",
              name: "Pizza Salami",
              kind: "pizza",
              defaultPriceLabel: "9,00 €",
              isAvailable: false,
            }),
          ],
        }),
      ),
    );
    const { findByText, getAllByText } = renderPage();

    expect(await findByText("Dürüm Kalb")).toBeInTheDocument();
    expect(await findByText("Pizza Salami")).toBeInTheDocument();
    // The retired item carries the "Nicht verfügbar" badge.
    expect(getAllByText("Nicht verfügbar").length).toBeGreaterThan(0);
  });

  it("legt ein Gericht an und sendet den Preis in Cent (Euro→Cent)", async () => {
    seedXsrfCookie();
    let receivedBody: unknown = null;
    mswServer.use(
      http.get("*/api/admin/menu", () => HttpResponse.json({ items: [] })),
      http.post("*/api/admin/menu", async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({ item: menuRow({ id: "neu", name: "Neu" }) }, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    const { findByLabelText, findByRole } = renderPage();

    await user.click(await findByRole("button", { name: "Gericht anlegen" }));
    await user.type(await findByLabelText("Name"), "Dürüm Kalb");
    const priceField = await findByLabelText("Preis (€)");
    await user.clear(priceField);
    await user.type(priceField, "8,50");
    await user.click(await findByRole("button", { name: "Anlegen" }));

    await waitFor(() => {
      expect(receivedBody).not.toBeNull();
    });
    const body = receivedBody as { name: string; defaultPriceCents: number; kind: string };
    expect(body.name).toBe("Dürüm Kalb");
    expect(body.defaultPriceCents).toBe(850);
    expect(body.kind).toBe("doener");
  });

  it("zeigt die 409-Meldung bei doppelter ID", async () => {
    seedXsrfCookie();
    mswServer.use(
      http.get("*/api/admin/menu", () => HttpResponse.json({ items: [] })),
      http.post("*/api/admin/menu", () =>
        HttpResponse.json({ title: "Konflikt" }, { status: 409 }),
      ),
    );
    const user = userEvent.setup();
    const { findByLabelText, findByRole, findByText } = renderPage();

    await user.click(await findByRole("button", { name: "Gericht anlegen" }));
    await user.type(await findByLabelText("Name"), "Dürüm Kalb");
    const priceField = await findByLabelText("Preis (€)");
    await user.clear(priceField);
    await user.type(priceField, "8,50");
    await user.click(await findByRole("button", { name: "Anlegen" }));

    expect(await findByText(/Diese ID gibt es schon/i)).toBeInTheDocument();
  });

  it("aktualisiert ein Gericht per PUT", async () => {
    seedXsrfCookie();
    let putBody: unknown = null;
    mswServer.use(
      http.get("*/api/admin/menu", () => HttpResponse.json({ items: [menuRow()] })),
      http.put("*/api/admin/menu/duerum-kalb", async ({ request }) => {
        putBody = await request.json();
        return HttpResponse.json({ item: menuRow({ name: "Dürüm Kalb XL" }) });
      }),
    );
    const user = userEvent.setup();
    const { findByText, findByRole, findByLabelText } = renderPage();

    await findByText("Dürüm Kalb");
    await user.click(await findByRole("button", { name: "Bearbeiten" }));
    const nameField = await findByLabelText("Name");
    await user.clear(nameField);
    await user.type(nameField, "Dürüm Kalb XL");
    await user.click(await findByRole("button", { name: "Speichern" }));

    await waitFor(() => {
      expect(putBody).not.toBeNull();
    });
    expect((putBody as { name: string }).name).toBe("Dürüm Kalb XL");
  });

  it("entfernt ein Gericht per DELETE und lädt die Karte neu", async () => {
    seedXsrfCookie();
    let deleteCalled = false;
    let listCallCount = 0;
    mswServer.use(
      http.get("*/api/admin/menu", () => {
        listCallCount += 1;
        return HttpResponse.json({ items: deleteCalled ? [] : [menuRow()] });
      }),
      http.delete("*/api/admin/menu/duerum-kalb", () => {
        deleteCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    const { findByText, findByRole } = renderPage();

    await findByText("Dürüm Kalb");
    await user.click(await findByRole("button", { name: "Entfernen" }));
    await user.click(await findByRole("button", { name: "Ja, entfernen" }));

    await waitFor(() => {
      expect(deleteCalled).toBe(true);
    });
    await waitFor(() => {
      expect(listCallCount).toBeGreaterThan(1);
    });
  });
});
