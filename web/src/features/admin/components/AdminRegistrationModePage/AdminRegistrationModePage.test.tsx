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
import { AdminRegistrationModePage } from "@/features/admin";
import { theme } from "@/styles/theme";
import { mswServer } from "@/test/mswServer";

// Seeds the CSRF cookie the apiClient echoes on every mutating request.
const seedXsrfCookie = (): void => {
  // biome-ignore lint/suspicious/noDocumentCookie: seeding the CSRF cookie the apiClient reads; Cookie Store API is unavailable in jsdom
  document.cookie = "dc_xsrf=test-token";
};

interface ModeResponse {
  mode: 1 | 2 | 3;
  secretKey: string | null;
}

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
    component: AdminRegistrationModePage,
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

describe("AdminRegistrationModePage", () => {
  it("lädt den Modus und zeigt das Code-Feld nur bei „Nur mit Registrierungscode“", async () => {
    const response: ModeResponse = { mode: 1, secretKey: null };
    mswServer.use(http.get("*/api/admin/registration-mode", () => HttpResponse.json(response)));
    const user = userEvent.setup();
    const { findByRole, queryByLabelText } = renderPage();

    // Enabled selected → no secret-key field.
    expect(await findByRole("radio", { name: "Offen für alle" })).toBeInTheDocument();
    expect(queryByLabelText("Registrierungscode")).toBeNull();

    // Pick SecretKeyOnly → the field appears.
    await user.click(await findByRole("radio", { name: "Nur mit Registrierungscode" }));
    await waitFor(() => {
      expect(queryByLabelText("Registrierungscode")).not.toBeNull();
    });
  });

  it("blockiert das Speichern von „Nur mit Registrierungscode“ ohne Code", async () => {
    seedXsrfCookie();
    let putCalled = false;
    const response: ModeResponse = { mode: 1, secretKey: null };
    mswServer.use(
      http.get("*/api/admin/registration-mode", () => HttpResponse.json(response)),
      http.put("*/api/admin/registration-mode", () => {
        putCalled = true;
        return HttpResponse.json(response);
      }),
    );
    const user = userEvent.setup();
    const { findByRole, findByText } = renderPage();

    await user.click(await findByRole("radio", { name: "Nur mit Registrierungscode" }));
    await user.click(await findByRole("button", { name: "Speichern" }));

    expect(
      await findByText("Für „Nur mit Registrierungscode“ brauchst du einen Code, Chef."),
    ).toBeInTheDocument();
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(putCalled).toBe(false);
  });

  it("speichert SecretKeyOnly samt Code per PUT und zeigt den Erfolg", async () => {
    seedXsrfCookie();
    let putBody: unknown = null;
    const initial: ModeResponse = { mode: 1, secretKey: null };
    mswServer.use(
      http.get("*/api/admin/registration-mode", () => HttpResponse.json(initial)),
      http.put("*/api/admin/registration-mode", async ({ request }) => {
        putBody = await request.json();
        return HttpResponse.json({ mode: 3, secretKey: "doener-2026" });
      }),
    );
    const user = userEvent.setup();
    const { findByRole, findByLabelText, findByText } = renderPage();

    await user.click(await findByRole("radio", { name: "Nur mit Registrierungscode" }));
    await user.type(await findByLabelText("Registrierungscode"), "doener-2026");
    await user.click(await findByRole("button", { name: "Speichern" }));

    await waitFor(() => {
      expect(putBody).not.toBeNull();
    });
    const body = putBody as { mode: number; secretKey: string };
    expect(body.mode).toBe(3);
    expect(body.secretKey).toBe("doener-2026");
    expect(
      await findByText("Gespeichert, Chef. Die Tür ist jetzt eingestellt."),
    ).toBeInTheDocument();
  });

  it("sendet bei „Geschlossen“ keinen Code mit", async () => {
    seedXsrfCookie();
    let putBody: Record<string, unknown> | null = null;
    const initial: ModeResponse = { mode: 1, secretKey: null };
    mswServer.use(
      http.get("*/api/admin/registration-mode", () => HttpResponse.json(initial)),
      http.put("*/api/admin/registration-mode", async ({ request }) => {
        putBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({ mode: 2, secretKey: null });
      }),
    );
    const user = userEvent.setup();
    const { findByRole } = renderPage();

    await user.click(await findByRole("radio", { name: "Geschlossen" }));
    await user.click(await findByRole("button", { name: "Speichern" }));

    await waitFor(() => {
      expect(putBody).not.toBeNull();
    });
    expect(putBody).toEqual({ mode: 2 });
  });
});
