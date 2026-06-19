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
import { AdminUsersPage } from "@/features/admin";
import { theme } from "@/styles/theme";
import { mswServer } from "@/test/mswServer";

// Seeds the CSRF cookie the apiClient echoes on every mutating request.
const seedXsrfCookie = (): void => {
  // biome-ignore lint/suspicious/noDocumentCookie: seeding the CSRF cookie the apiClient reads; Cookie Store API is unavailable in jsdom
  document.cookie = "dc_xsrf=test-token";
};

const userRow = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: "u1",
  username: "markus.wagner",
  displayName: "Markus Wagner",
  role: "Admin",
  isActive: true,
  mustChangePassword: false,
  payPalHandle: "MarkusW",
  createdAt: "2026-01-01T00:00:00Z",
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
    component: AdminUsersPage,
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

describe("AdminUsersPage", () => {
  it("rendert die Benutzerliste", async () => {
    mswServer.use(
      http.get("*/api/admin/users", () =>
        HttpResponse.json({
          users: [
            userRow(),
            userRow({ id: "u2", username: "lisa.k", displayName: "Lisa K.", role: "Employee" }),
          ],
        }),
      ),
    );
    const { findByText } = renderPage();

    expect(await findByText("Markus Wagner")).toBeInTheDocument();
    expect(await findByText("@lisa.k")).toBeInTheDocument();
  });

  it("legt einen Kollegen an und zeigt das Start-Passwort genau einmal", async () => {
    seedXsrfCookie();
    let receivedBody: unknown = null;
    mswServer.use(
      http.get("*/api/admin/users", () => HttpResponse.json({ users: [] })),
      http.post("*/api/admin/users", async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json(
          { userId: "new", username: "neu.kollege", temporaryPassword: "Start1234xy" },
          { status: 201 },
        );
      }),
    );
    const user = userEvent.setup();
    const { findByLabelText, findByRole, findByText } = renderPage();

    await user.click(await findByRole("button", { name: "Kollegen anlegen" }));
    await user.type(await findByLabelText("Benutzername"), "neu.kollege");
    await user.type(await findByLabelText("Anzeigename"), "Neuer Kollege");
    await user.click(await findByRole("button", { name: "Anlegen" }));

    expect(await findByText("Start1234xy")).toBeInTheDocument();
    expect(await findByText(/Einmalig sichtbar/i)).toBeInTheDocument();
    expect(receivedBody).toEqual({
      username: "neu.kollege",
      displayName: "Neuer Kollege",
      role: 1,
    });
  });

  it("zeigt die 409-Meldung bei doppeltem Benutzernamen", async () => {
    seedXsrfCookie();
    mswServer.use(
      http.get("*/api/admin/users", () => HttpResponse.json({ users: [] })),
      http.post("*/api/admin/users", () =>
        HttpResponse.json({ title: "Konflikt" }, { status: 409 }),
      ),
    );
    const user = userEvent.setup();
    const { findByLabelText, findByRole, findByText } = renderPage();

    await user.click(await findByRole("button", { name: "Kollegen anlegen" }));
    await user.type(await findByLabelText("Benutzername"), "markus.wagner");
    await user.type(await findByLabelText("Anzeigename"), "Markus Wagner");
    await user.click(await findByRole("button", { name: "Anlegen" }));

    expect(await findByText(/Benutzernamen gibt es schon/i)).toBeInTheDocument();
  });

  it("deaktiviert einen Kollegen per DELETE und lädt die Liste neu", async () => {
    seedXsrfCookie();
    let deleteCalled = false;
    let listCallCount = 0;
    mswServer.use(
      http.get("*/api/admin/users", () => {
        listCallCount += 1;
        // After the DELETE the list refetches; return the now-inactive row.
        const active = !deleteCalled;
        return HttpResponse.json({ users: [userRow({ isActive: active })] });
      }),
      http.delete("*/api/admin/users/u1", () => {
        deleteCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    const { findByText, findByRole } = renderPage();

    await findByText("Markus Wagner");
    await user.click(await findByRole("button", { name: "Deaktivieren" }));
    // Confirm dialog -> confirm
    await user.click(await findByRole("button", { name: "Ja, deaktivieren" }));

    await waitFor(() => {
      expect(deleteCalled).toBe(true);
    });
    await waitFor(() => {
      expect(listCallCount).toBeGreaterThan(1);
    });
  });

  it("zeigt das neue Start-Passwort nach dem Zurücksetzen", async () => {
    seedXsrfCookie();
    mswServer.use(
      http.get("*/api/admin/users", () => HttpResponse.json({ users: [userRow()] })),
      http.post("*/api/admin/users/u1/reset-password", () =>
        HttpResponse.json({ temporaryPassword: "Reset9876ab" }),
      ),
    );
    const user = userEvent.setup();
    const { findByText, findByRole } = renderPage();

    await findByText("Markus Wagner");
    await user.click(await findByRole("button", { name: "Passwort zurücksetzen" }));
    await user.click(await findByRole("button", { name: "Ja, zurücksetzen" }));

    expect(await findByText("Reset9876ab")).toBeInTheDocument();
    expect(await findByText(/Einmalig sichtbar/i)).toBeInTheDocument();
  });

  it("zeigt die 409-Meldung beim letzten aktiven Admin", async () => {
    seedXsrfCookie();
    mswServer.use(
      http.get("*/api/admin/users", () => HttpResponse.json({ users: [userRow()] })),
      http.delete("*/api/admin/users/u1", () =>
        HttpResponse.json({ title: "Letzter Admin" }, { status: 409 }),
      ),
    );
    const user = userEvent.setup();
    const { findByText, findByRole } = renderPage();

    await findByText("Markus Wagner");
    await user.click(await findByRole("button", { name: "Deaktivieren" }));
    await user.click(await findByRole("button", { name: "Ja, deaktivieren" }));

    expect(await findByText(/letzte aktive Admin/i)).toBeInTheDocument();
  });
});
