import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { mswServer } from "@/test/mswServer";
import { renderApp } from "@/test/renderApp";
import { authCopy } from "../../copy";

// Cookie the apiClient reads to echo as the X-XSRF-TOKEN header on the mutating
// register POST. Direct cookie assignment is exactly what the browser does; the
// Cookie Store API is not available in jsdom, so the suppression is intentional.
const seedXsrfCookie = (): void => {
  // biome-ignore lint/suspicious/noDocumentCookie: seeding the CSRF cookie the apiClient reads; Cookie Store API is unavailable in jsdom
  document.cookie = "dc_xsrf=test-token";
};

// Anonymous visitor: `/me` always reports not-logged-in so the register route's
// guard lets the page render. The register endpoint behaviour is set per test.
const useAnonymousMe = (): void => {
  mswServer.use(
    http.get("*/api/auth/me", () =>
      HttpResponse.json({ detail: "Nicht angemeldet." }, { status: 401 }),
    ),
  );
};

const useRegisterSuccess = (): void => {
  mswServer.use(
    http.post("*/api/auth/register", () =>
      HttpResponse.json(
        {
          userId: "22222222-2222-2222-2222-222222222222",
          username: "m.wagner",
          displayName: "Markus Wagner",
        },
        { status: 201 },
      ),
    ),
  );
};

// Real FastEndpoints error envelope (no `detail` field) — the form hook must
// branch on the HTTP status, not on a body field.
const useRegisterDuplicate = (): void => {
  mswServer.use(
    http.post("*/api/auth/register", () =>
      HttpResponse.json(
        {
          statusCode: 409,
          message: "Benutzername ist bereits vergeben.",
          errors: { generalErrors: ["Benutzername ist bereits vergeben."] },
        },
        { status: 409 },
      ),
    ),
  );
};

// Wrong/missing invite code → 403, same envelope shape, no `detail` field.
const useRegisterCodeInvalid = (): void => {
  mswServer.use(
    http.post("*/api/auth/register", () =>
      HttpResponse.json(
        {
          statusCode: 403,
          message: "Registrierungscode ungültig.",
          errors: { generalErrors: ["Registrierungscode ungültig."] },
        },
        { status: 403 },
      ),
    ),
  );
};

const fillValidForm = async (
  user: ReturnType<typeof userEvent.setup>,
  findByLabelText: (text: string) => Promise<HTMLElement>,
): Promise<void> => {
  await user.type(await findByLabelText("Benutzername"), "m.wagner");
  await user.type(await findByLabelText("Anzeigename"), "Markus Wagner");
  await user.type(await findByLabelText("Passwort"), "geheim1234");
  await user.type(await findByLabelText("Passwort bestätigen"), "geheim1234");
};

describe("RegisterPage", () => {
  it("renders the registration form", async () => {
    useAnonymousMe();
    const { findByRole, findByLabelText } = renderApp({ initialPath: "/register" });

    expect(await findByRole("button", { name: "Konto anlegen" })).toBeInTheDocument();
    expect(await findByLabelText("Benutzername")).toBeInTheDocument();
    expect(await findByLabelText("Passwort bestätigen")).toBeInTheDocument();
  });

  it("shows the mismatch error and does not submit when passwords differ", async () => {
    seedXsrfCookie();
    useAnonymousMe();
    let registerCalled = false;
    mswServer.use(
      http.post("*/api/auth/register", () => {
        registerCalled = true;
        return HttpResponse.json({ detail: "Sollte nie aufgerufen werden." }, { status: 500 });
      }),
    );
    const user = userEvent.setup();
    const { findByRole, findByLabelText, findByText } = renderApp({ initialPath: "/register" });

    await user.type(await findByLabelText("Benutzername"), "m.wagner");
    await user.type(await findByLabelText("Anzeigename"), "Markus Wagner");
    await user.type(await findByLabelText("Passwort"), "geheim1234");
    await user.type(await findByLabelText("Passwort bestätigen"), "geheim9999");
    await user.click(await findByRole("button", { name: "Konto anlegen" }));

    expect(await findByText("Die Passwörter stimmen nicht überein, Chef.")).toBeInTheDocument();
    expect(registerCalled).toBe(false);
  });

  it("shows the success panel after a valid submit", async () => {
    seedXsrfCookie();
    useAnonymousMe();
    useRegisterSuccess();
    const user = userEvent.setup();
    const { findByRole, findByLabelText, findByText } = renderApp({ initialPath: "/register" });

    await fillValidForm(user, findByLabelText);
    await user.click(await findByRole("button", { name: "Konto anlegen" }));

    expect(await findByText("Konto erstellt, Chef!")).toBeInTheDocument();
  });

  it("surfaces the duplicate-username error from a 409", async () => {
    seedXsrfCookie();
    useAnonymousMe();
    useRegisterDuplicate();
    const user = userEvent.setup();
    const { findByRole, findByLabelText, findByText } = renderApp({ initialPath: "/register" });

    await fillValidForm(user, findByLabelText);
    await user.click(await findByRole("button", { name: "Konto anlegen" }));

    expect(await findByText(authCopy.registerDuplicate)).toBeInTheDocument();
  });

  it("surfaces the invite-code error from a 403", async () => {
    seedXsrfCookie();
    useAnonymousMe();
    useRegisterCodeInvalid();
    const user = userEvent.setup();
    const { findByRole, findByLabelText, findByText } = renderApp({ initialPath: "/register" });

    await fillValidForm(user, findByLabelText);
    await user.click(await findByRole("button", { name: "Konto anlegen" }));

    expect(await findByText(authCopy.registerCodeInvalid)).toBeInTheDocument();
  });

  it("forwards the secretKey from the URL on the register request", async () => {
    seedXsrfCookie();
    useAnonymousMe();
    let receivedBody: Record<string, unknown> | null = null;
    mswServer.use(
      http.post("*/api/auth/register", async ({ request }) => {
        receivedBody = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json(
          {
            userId: "22222222-2222-2222-2222-222222222222",
            username: "m.wagner",
            displayName: "Markus Wagner",
          },
          { status: 201 },
        );
      }),
    );
    const user = userEvent.setup();
    const { findByRole, findByLabelText } = renderApp({
      initialPath: "/register?secretKey=doener-2026",
    });

    await fillValidForm(user, findByLabelText);
    await user.click(await findByRole("button", { name: "Konto anlegen" }));

    await waitFor(() => {
      expect(receivedBody).not.toBeNull();
    });
    expect((receivedBody as unknown as { secretKey: string }).secretKey).toBe("doener-2026");
  });

  it("shows the secret-key hint when registration is secret-key-only and no key is present", async () => {
    useAnonymousMe();
    mswServer.use(
      http.get("*/api/config", () =>
        HttpResponse.json({ pwaGateEnabled: false, registrationMode: 3 }),
      ),
    );
    const { findByText, queryByLabelText } = renderApp({ initialPath: "/register" });

    expect(await findByText("Registrierung nur mit Code")).toBeInTheDocument();
    expect(queryByLabelText("Benutzername")).toBeNull();
  });

  it("renders the form in secret-key-only mode when the URL carries a key", async () => {
    useAnonymousMe();
    mswServer.use(
      http.get("*/api/config", () =>
        HttpResponse.json({ pwaGateEnabled: false, registrationMode: 3 }),
      ),
    );
    const { findByLabelText } = renderApp({ initialPath: "/register?secretKey=doener-2026" });

    expect(await findByLabelText("Benutzername")).toBeInTheDocument();
  });

  it("redirects an authenticated visitor away from /register", async () => {
    mswServer.use(
      http.get("*/api/auth/me", () =>
        HttpResponse.json({
          userId: "11111111-1111-1111-1111-111111111111",
          displayName: "Markus Wagner",
          firstName: "Markus",
          initials: "MW",
          avatarColorHex: "#00728E",
          role: "employee",
          payPalHandleSet: true,
          payPalHandle: "MarkusW",
          mustChangePassword: false,
        }),
      ),
    );
    const { router } = renderApp({ initialPath: "/register" });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/");
    });
  });
});
