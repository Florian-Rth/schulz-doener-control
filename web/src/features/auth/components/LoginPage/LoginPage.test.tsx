import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { mswServer } from "@/test/mswServer";
import { renderApp } from "@/test/renderApp";

// Cookie the apiClient reads to echo as the X-XSRF-TOKEN header. Direct cookie
// assignment is exactly what the browser does; the Cookie Store API is not
// available in jsdom, so the suppression is intentional for this test seam.
const seedXsrfCookie = (): void => {
  // biome-ignore lint/suspicious/noDocumentCookie: seeding the CSRF cookie the apiClient reads; Cookie Store API is unavailable in jsdom
  document.cookie = "dc_xsrf=test-token";
};

const authenticatedSession = {
  userId: "11111111-1111-1111-1111-111111111111",
  displayName: "Markus Wagner",
  firstName: "Markus",
  initials: "MW",
  avatarColorHex: "#00728E",
  role: "employee",
  payPalHandleSet: true,
  payPalHandle: "MarkusW",
  mustChangePassword: false,
};

// A stateful auth fixture: `/me` reflects whether the session is authenticated,
// and the login endpoint flips it on. This mirrors the real cookie lifecycle
// (login sets the cookie → the next `/me` is authenticated) inside MSW.
const useAuthHandlers = (initiallyAuthenticated: boolean): void => {
  let authenticated = initiallyAuthenticated;
  mswServer.use(
    http.get("*/api/auth/me", () => {
      if (authenticated) {
        return HttpResponse.json(authenticatedSession);
      }
      return HttpResponse.json({ detail: "Nicht angemeldet." }, { status: 401 });
    }),
    http.post("*/api/auth/login", () => {
      authenticated = true;
      return HttpResponse.json({
        displayName: "Markus Wagner",
        mustChangePassword: false,
        payPalHandleSet: true,
      });
    }),
  );
};

describe("LoginPage", () => {
  it("shows validation messages when submitting an empty form", async () => {
    useAuthHandlers(false);
    const user = userEvent.setup();
    const { findByRole, findAllByText } = renderApp({ initialPath: "/login" });

    const submit = await findByRole("button", { name: "Anmelden" });
    await user.click(submit);

    const errors = await findAllByText("Pflichtfeld");
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });

  it("logs in on a valid submit and navigates to the home dashboard", async () => {
    seedXsrfCookie();
    useAuthHandlers(false);
    const user = userEvent.setup();
    const { findByRole, findByLabelText, router } = renderApp({ initialPath: "/login" });

    await user.type(await findByLabelText("Benutzername"), "m.wagner");
    await user.type(await findByLabelText("Passwort"), "geheim123");
    await user.click(await findByRole("button", { name: "Anmelden" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/");
    });
  });
});

describe("auth route guard", () => {
  it("redirects an unauthenticated visit to a protected route to /login", async () => {
    useAuthHandlers(false);
    const { router } = renderApp({ initialPath: "/" });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/login");
    });
  });
});
