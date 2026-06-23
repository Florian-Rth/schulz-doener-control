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
import { AdminNotificationTemplatesPage } from "@/features/admin";
import { theme } from "@/styles/theme";
import { mswServer } from "@/test/mswServer";

// Seeds the CSRF cookie the apiClient echoes on every mutating request.
const seedXsrfCookie = (): void => {
  // biome-ignore lint/suspicious/noDocumentCookie: seeding the CSRF cookie the apiClient reads; Cookie Store API is unavailable in jsdom
  document.cookie = "dc_xsrf=test-token";
};

const TEMPLATE_ID = "11111111-1111-1111-1111-111111111111";

const templateRow = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: TEMPLATE_ID,
  synonym: "Drehspieß-Tasche",
  body: "Heute rotiert die Drehspieß-Tasche! 🌯",
  isActive: true,
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
    component: AdminNotificationTemplatesPage,
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

describe("AdminNotificationTemplatesPage", () => {
  it("rendert die Sprüche und markiert inaktive", async () => {
    mswServer.use(
      http.get("*/api/admin/notification-templates", () =>
        HttpResponse.json({
          items: [templateRow(), templateRow({ id: "22", synonym: "Klappkatze", isActive: false })],
        }),
      ),
    );
    const { findByText, getAllByText } = renderPage();

    expect(await findByText("Drehspieß-Tasche")).toBeInTheDocument();
    expect(await findByText("Klappkatze")).toBeInTheDocument();
    expect(getAllByText("Inaktiv").length).toBeGreaterThan(0);
  });

  it("legt einen Spruch an und sendet synonym/body/isActive", async () => {
    seedXsrfCookie();
    let receivedBody: unknown = null;
    mswServer.use(
      http.get("*/api/admin/notification-templates", () => HttpResponse.json({ items: [] })),
      http.post("*/api/admin/notification-templates", async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({ item: templateRow() }, { status: 201 });
      }),
    );
    const user = userEvent.setup();
    const { findByLabelText, findByRole } = renderPage();

    await user.click(await findByRole("button", { name: "Spruch anlegen" }));
    await user.type(await findByLabelText("Döner-Synonym"), "Drehspieß-Tasche");
    await user.type(await findByLabelText("Push-Text"), "Heute rotiert die Drehspieß-Tasche! 🌯");
    await user.click(await findByRole("button", { name: "Anlegen" }));

    await waitFor(() => {
      expect(receivedBody).not.toBeNull();
    });
    const body = receivedBody as { synonym: string; body: string; isActive: boolean };
    expect(body.synonym).toBe("Drehspieß-Tasche");
    expect(body.body).toBe("Heute rotiert die Drehspieß-Tasche! 🌯");
    expect(body.isActive).toBe(true);
  });

  it("aktualisiert einen Spruch per PUT", async () => {
    seedXsrfCookie();
    let putBody: unknown = null;
    mswServer.use(
      http.get("*/api/admin/notification-templates", () =>
        HttpResponse.json({ items: [templateRow()] }),
      ),
      http.put(`*/api/admin/notification-templates/${TEMPLATE_ID}`, async ({ request }) => {
        putBody = await request.json();
        return HttpResponse.json({ item: templateRow({ body: "Neuer Text! 🌯" }) });
      }),
    );
    const user = userEvent.setup();
    const { findByText, findByRole, findByLabelText } = renderPage();

    await findByText("Drehspieß-Tasche");
    await user.click(await findByRole("button", { name: "Bearbeiten" }));
    const bodyField = await findByLabelText("Push-Text");
    await user.clear(bodyField);
    await user.type(bodyField, "Neuer Text! 🌯");
    await user.click(await findByRole("button", { name: "Speichern" }));

    await waitFor(() => {
      expect(putBody).not.toBeNull();
    });
    expect((putBody as { body: string }).body).toBe("Neuer Text! 🌯");
  });

  it("blockiert das Speichern mit leerem Text", async () => {
    seedXsrfCookie();
    let putCalled = false;
    mswServer.use(
      http.get("*/api/admin/notification-templates", () =>
        HttpResponse.json({ items: [templateRow()] }),
      ),
      http.put(`*/api/admin/notification-templates/${TEMPLATE_ID}`, () => {
        putCalled = true;
        return HttpResponse.json({ item: templateRow() });
      }),
    );
    const user = userEvent.setup();
    const { findByText, findByRole, findByLabelText } = renderPage();

    await findByText("Drehspieß-Tasche");
    await user.click(await findByRole("button", { name: "Bearbeiten" }));
    await user.clear(await findByLabelText("Push-Text"));
    await user.click(await findByRole("button", { name: "Speichern" }));

    expect(await findByText("Pflichtfeld")).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(putCalled).toBe(false);
  });

  it("entfernt einen Spruch per DELETE und lädt die Liste neu", async () => {
    seedXsrfCookie();
    let deleteCalled = false;
    let listCallCount = 0;
    mswServer.use(
      http.get("*/api/admin/notification-templates", () => {
        listCallCount += 1;
        return HttpResponse.json({ items: deleteCalled ? [] : [templateRow()] });
      }),
      http.delete(`*/api/admin/notification-templates/${TEMPLATE_ID}`, () => {
        deleteCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    const { findByText, findByRole } = renderPage();

    await findByText("Drehspieß-Tasche");
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
