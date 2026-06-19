import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { mswServer } from "@/test/mswServer";
import { renderApp } from "@/test/renderApp";

// Cookie the apiClient echoes as the X-XSRF-TOKEN header on the mutating POST.
const seedXsrfCookie = (): void => {
  // biome-ignore lint/suspicious/noDocumentCookie: seeding the CSRF cookie the apiClient reads; Cookie Store API is unavailable in jsdom
  document.cookie = "dc_xsrf=test-token";
};

const lockedSession = {
  userId: "22222222-2222-2222-2222-222222222222",
  displayName: "Sara Yilmaz",
  firstName: "Sara",
  initials: "SY",
  avatarColorHex: "#C90023",
  role: "employee",
  payPalHandleSet: false,
  payPalHandle: null,
  mustChangePassword: true,
};

const unlockedSession = { ...lockedSession, mustChangePassword: false, payPalHandleSet: true };

const INITIAL = "Schulz-Start!";
const NEW = "ganzNeuesPw7";

interface ChangePasswordFixture {
  /** The body the SPA POSTed to change-password (null until a request lands). */
  body: () => unknown;
  /** How many change-password requests reached the server. */
  requestCount: () => number;
}

// Stateful `/me`: while locked the backend gate answers 403; once a 204 change
// lands the SPA invalidates the session and the next `/me` returns an unlocked
// profile, so the guard lets the home route render. `status` controls what the
// change-password endpoint answers (204 success, or 401 wrong current password).
const useChangePasswordHandlers = (status: 204 | 401 = 204): ChangePasswordFixture => {
  let locked = true;
  let body: unknown = null;
  let requestCount = 0;
  mswServer.use(
    http.get("*/api/auth/me", () => {
      if (locked) {
        return HttpResponse.json({ detail: "Passwort ändern." }, { status: 403 });
      }
      return HttpResponse.json(unlockedSession);
    }),
    http.post("*/api/auth/change-password", async ({ request }) => {
      requestCount += 1;
      body = await request.json();
      if (status === 401) {
        return HttpResponse.json({ detail: "Unauthorized" }, { status: 401 });
      }
      locked = false;
      return new HttpResponse(null, { status: 204 });
    }),
  );
  return { body: () => body, requestCount: () => requestCount };
};

describe("ChangePasswordForm — forced-change flow", () => {
  it("schickt einen gesperrten Account auf /passwort-aendern und nach Erfolg nach Hause", async () => {
    seedXsrfCookie();
    const fixture = useChangePasswordHandlers(204);
    // Once unlocked, the home route mounts the dashboard which fetches this. We
    // only assert the route landed on "/", so an empty body (the query then
    // errors harmlessly) is enough to keep MSW from flagging an unhandled request.
    mswServer.use(http.get("*/api/dashboard", () => HttpResponse.json({})));

    const user = userEvent.setup();
    // Land on home; the guard must bounce a locked account to /passwort-aendern.
    const { findByLabelText, findByRole, router } = renderApp({ initialPath: "/" });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/passwort-aendern");
    });

    await user.type(await findByLabelText("Aktuelles Passwort"), INITIAL);
    await user.type(await findByLabelText("Neues Passwort"), NEW);
    await user.type(await findByLabelText("Neues Passwort bestätigen"), NEW);
    await user.click(await findByRole("button", { name: "Passwort speichern" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/");
    });
    expect(fixture.body()).toEqual({ currentPassword: INITIAL, newPassword: NEW });
  });

  it("zeigt einen Validierungsfehler, wenn die Passwörter nicht übereinstimmen", async () => {
    seedXsrfCookie();
    const fixture = useChangePasswordHandlers(204);

    const user = userEvent.setup();
    const { findByLabelText, findByRole, findByText } = renderApp({
      initialPath: "/passwort-aendern",
    });

    await user.type(await findByLabelText("Aktuelles Passwort"), INITIAL);
    await user.type(await findByLabelText("Neues Passwort"), NEW);
    await user.type(await findByLabelText("Neues Passwort bestätigen"), "andersPw9");
    await user.click(await findByRole("button", { name: "Passwort speichern" }));

    expect(await findByText(/stimmen nicht überein/i)).toBeInTheDocument();
    expect(fixture.requestCount()).toBe(0);
  });

  it("zeigt den Server-Fehler, wenn das aktuelle Passwort falsch ist", async () => {
    seedXsrfCookie();
    useChangePasswordHandlers(401);

    const user = userEvent.setup();
    const { findByLabelText, findByRole, findByText, router } = renderApp({
      initialPath: "/passwort-aendern",
    });

    await user.type(await findByLabelText("Aktuelles Passwort"), "falsch");
    await user.type(await findByLabelText("Neues Passwort"), NEW);
    await user.type(await findByLabelText("Neues Passwort bestätigen"), NEW);
    await user.click(await findByRole("button", { name: "Passwort speichern" }));

    expect(await findByText(/aktuelle Passwort stimmt nicht/i)).toBeInTheDocument();
    // A failed change must not navigate away from the locked page.
    expect(router.state.location.pathname).toBe("/passwort-aendern");
  });
});
