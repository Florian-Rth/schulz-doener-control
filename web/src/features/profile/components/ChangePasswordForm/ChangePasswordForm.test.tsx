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

// Forced flow: the freshly provisioned account is locked, so `GET /api/auth/me`
// answers 403 (the SPA maps that to the LOCKED_SESSION sentinel) until a 204
// change lands; the next `/me` then returns an unlocked profile so the guard lets
// the home route render. The forced backend path needs no current password, so it
// always answers 204 (no 401 branch exists for forced).
const useForcedHandlers = (): ChangePasswordFixture => {
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
      locked = false;
      return new HttpResponse(null, { status: 204 });
    }),
  );
  return { body: () => body, requestCount: () => requestCount };
};

// Self-service flow: the account is already unlocked (`mustChangePassword=false`),
// reached from the profile menu. `GET /api/auth/me` returns the unlocked profile
// throughout. `status` controls what the change-password endpoint answers
// (204 success, or 401 wrong current password).
const useSelfServiceHandlers = (status: 204 | 401 = 204): ChangePasswordFixture => {
  let body: unknown = null;
  let requestCount = 0;
  mswServer.use(
    http.get("*/api/auth/me", () => HttpResponse.json(unlockedSession)),
    http.post("*/api/auth/change-password", async ({ request }) => {
      requestCount += 1;
      body = await request.json();
      if (status === 401) {
        return HttpResponse.json({ detail: "Unauthorized" }, { status: 401 });
      }
      return new HttpResponse(null, { status: 204 });
    }),
  );
  return { body: () => body, requestCount: () => requestCount };
};

describe("ChangePasswordForm — forced-change flow", () => {
  it("rendert das Feld 'Aktuelles Passwort' NICHT, wenn mustChangePassword=true", async () => {
    seedXsrfCookie();
    useForcedHandlers();

    const { findByLabelText, queryByLabelText } = renderApp({ initialPath: "/passwort-aendern" });

    // The two new-password fields must be present so the form is interactive…
    await findByLabelText("Neues Passwort");
    // …but the current-password field is suppressed in forced mode.
    expect(queryByLabelText("Aktuelles Passwort")).toBeNull();
  });

  it("schickt einen gesperrten Account auf /passwort-aendern und nach Erfolg nach Hause (Payload ohne currentPassword)", async () => {
    seedXsrfCookie();
    const fixture = useForcedHandlers();
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

    await user.type(await findByLabelText("Neues Passwort"), NEW);
    await user.type(await findByLabelText("Neues Passwort bestätigen"), NEW);
    await user.click(await findByRole("button", { name: "Passwort speichern" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/");
    });
    // Forced mode omits currentPassword from the wire body entirely.
    expect(fixture.body()).toEqual({ newPassword: NEW });
  });

  it("zeigt einen Validierungsfehler, wenn die Passwörter nicht übereinstimmen", async () => {
    seedXsrfCookie();
    const fixture = useForcedHandlers();

    const user = userEvent.setup();
    const { findByLabelText, findByRole, findByText } = renderApp({
      initialPath: "/passwort-aendern",
    });

    await user.type(await findByLabelText("Neues Passwort"), NEW);
    await user.type(await findByLabelText("Neues Passwort bestätigen"), "andersPw9");
    await user.click(await findByRole("button", { name: "Passwort speichern" }));

    expect(await findByText(/stimmen nicht überein/i)).toBeInTheDocument();
    expect(fixture.requestCount()).toBe(0);
  });
});

describe("ChangePasswordForm — self-service flow", () => {
  it("rendert das Feld 'Aktuelles Passwort' und verlangt es, wenn mustChangePassword=false", async () => {
    seedXsrfCookie();
    const fixture = useSelfServiceHandlers(204);

    const user = userEvent.setup();
    const { findByLabelText, findByRole, findByText } = renderApp({
      initialPath: "/passwort-aendern",
    });

    // The current-password field is rendered in self-service mode…
    await findByLabelText("Aktuelles Passwort");
    // …and it is required: submitting without it surfaces a validation error and
    // never reaches the server.
    await user.type(await findByLabelText("Neues Passwort"), NEW);
    await user.type(await findByLabelText("Neues Passwort bestätigen"), NEW);
    await user.click(await findByRole("button", { name: "Passwort speichern" }));

    expect(await findByText(/Pflichtfeld/i)).toBeInTheDocument();
    expect(fixture.requestCount()).toBe(0);
  });

  it("sendet currentPassword im Payload, wenn mustChangePassword=false", async () => {
    seedXsrfCookie();
    const fixture = useSelfServiceHandlers(204);
    // After a successful self-service change the form awaits a fresh `/me` and
    // routes home; the dashboard query fires there.
    mswServer.use(http.get("*/api/dashboard", () => HttpResponse.json({})));

    const user = userEvent.setup();
    const { findByLabelText, findByRole, router } = renderApp({
      initialPath: "/passwort-aendern",
    });

    await user.type(await findByLabelText("Aktuelles Passwort"), INITIAL);
    await user.type(await findByLabelText("Neues Passwort"), NEW);
    await user.type(await findByLabelText("Neues Passwort bestätigen"), NEW);
    await user.click(await findByRole("button", { name: "Passwort speichern" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/");
    });
    // Self-service mode includes currentPassword on the wire.
    expect(fixture.body()).toEqual({ currentPassword: INITIAL, newPassword: NEW });
  });

  it("zeigt den Server-Fehler, wenn das aktuelle Passwort falsch ist", async () => {
    seedXsrfCookie();
    useSelfServiceHandlers(401);

    const user = userEvent.setup();
    const { findByLabelText, findByRole, findByText, router } = renderApp({
      initialPath: "/passwort-aendern",
    });

    await user.type(await findByLabelText("Aktuelles Passwort"), "falsch");
    await user.type(await findByLabelText("Neues Passwort"), NEW);
    await user.type(await findByLabelText("Neues Passwort bestätigen"), NEW);
    await user.click(await findByRole("button", { name: "Passwort speichern" }));

    expect(await findByText(/aktuelle Passwort stimmt nicht/i)).toBeInTheDocument();
    // A failed change must not navigate away from the page.
    expect(router.state.location.pathname).toBe("/passwort-aendern");
  });
});
