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
import { AdminPizzaVariantsPage } from "@/features/admin";
import { theme } from "@/styles/theme";
import { mswServer } from "@/test/mswServer";

// Seeds the CSRF cookie the apiClient echoes on every mutating request.
const seedXsrfCookie = (): void => {
  // biome-ignore lint/suspicious/noDocumentCookie: seeding the CSRF cookie the apiClient reads; Cookie Store API is unavailable in jsdom
  document.cookie = "dc_xsrf=test-token";
};

const variantRow = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: "margherita",
  name: "Margherita",
  icon: "local_pizza",
  sortOrder: 1,
  isAvailable: true,
  ...overrides,
});

// The page calls `useNavigate`, so it must be mounted inside a router. A minimal memory router with
// the page at the index route satisfies that without pulling in the full app tree / auth guards.
const renderPage = (): ReturnType<typeof render> => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: AdminPizzaVariantsPage,
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

describe("AdminPizzaVariantsPage", () => {
  it("rendert die Sorten und markiert nicht verfügbare", async () => {
    mswServer.use(
      http.get("*/api/admin/pizza-variants", () =>
        HttpResponse.json({
          items: [variantRow(), variantRow({ id: "funghi", name: "Funghi", isAvailable: false })],
        }),
      ),
    );
    const { findByText, getAllByText } = renderPage();

    expect(await findByText("Margherita")).toBeInTheDocument();
    expect(await findByText("Funghi")).toBeInTheDocument();
    // The unavailable variant carries the "Nicht verfügbar" badge.
    expect(getAllByText("Nicht verfügbar").length).toBeGreaterThan(0);
  });

  it("legt eine Sorte an und sendet Name + Reihenfolge", async () => {
    seedXsrfCookie();
    let receivedBody: unknown = null;
    mswServer.use(
      http.get("*/api/admin/pizza-variants", () => HttpResponse.json({ items: [] })),
      http.post("*/api/admin/pizza-variants", async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json(
          { item: variantRow({ id: "neu", name: "Tonno" }) },
          { status: 201 },
        );
      }),
    );
    const user = userEvent.setup();
    const { findByLabelText, findByRole } = renderPage();

    await user.click(await findByRole("button", { name: "Sorte anlegen" }));
    await user.type(await findByLabelText("Name"), "Tonno");
    await user.click(await findByRole("button", { name: "Anlegen" }));

    await waitFor(() => {
      expect(receivedBody).not.toBeNull();
    });
    const body = receivedBody as { name: string; sortOrder: number; isAvailable: boolean };
    expect(body.name).toBe("Tonno");
    expect(body.sortOrder).toBe(0);
    expect(body.isAvailable).toBe(true);
  });

  it("zeigt die 409-Meldung bei doppeltem Namen", async () => {
    seedXsrfCookie();
    mswServer.use(
      http.get("*/api/admin/pizza-variants", () => HttpResponse.json({ items: [] })),
      http.post("*/api/admin/pizza-variants", () =>
        HttpResponse.json({ title: "Konflikt" }, { status: 409 }),
      ),
    );
    const user = userEvent.setup();
    const { findByLabelText, findByRole, findByText } = renderPage();

    await user.click(await findByRole("button", { name: "Sorte anlegen" }));
    await user.type(await findByLabelText("Name"), "Margherita");
    await user.click(await findByRole("button", { name: "Anlegen" }));

    expect(await findByText(/Diese Sorte gibt es schon/i)).toBeInTheDocument();
  });

  it("aktualisiert eine Sorte per PUT", async () => {
    seedXsrfCookie();
    let putBody: unknown = null;
    mswServer.use(
      http.get("*/api/admin/pizza-variants", () => HttpResponse.json({ items: [variantRow()] })),
      http.put("*/api/admin/pizza-variants/margherita", async ({ request }) => {
        putBody = await request.json();
        return HttpResponse.json({ item: variantRow({ name: "Margherita XL" }) });
      }),
    );
    const user = userEvent.setup();
    const { findByText, findByRole, findByLabelText } = renderPage();

    await findByText("Margherita");
    await user.click(await findByRole("button", { name: "Bearbeiten" }));
    const nameField = await findByLabelText("Name");
    await user.clear(nameField);
    await user.type(nameField, "Margherita XL");
    await user.click(await findByRole("button", { name: "Speichern" }));

    await waitFor(() => {
      expect(putBody).not.toBeNull();
    });
    expect((putBody as { name: string }).name).toBe("Margherita XL");
  });

  it("entfernt eine Sorte per DELETE und lädt die Liste neu", async () => {
    seedXsrfCookie();
    let deleteCalled = false;
    let listCallCount = 0;
    mswServer.use(
      http.get("*/api/admin/pizza-variants", () => {
        listCallCount += 1;
        return HttpResponse.json({ items: deleteCalled ? [] : [variantRow()] });
      }),
      http.delete("*/api/admin/pizza-variants/margherita", () => {
        deleteCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    const { findByText, findByRole } = renderPage();

    await findByText("Margherita");
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
