import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import { mswServer } from "@/test/mswServer";
import { renderApp } from "@/test/renderApp";

// Cookie the apiClient echoes as the X-XSRF-TOKEN header on the mutating PUTs.
const seedXsrfCookie = (): void => {
  // biome-ignore lint/suspicious/noDocumentCookie: seeding the CSRF cookie the apiClient reads; Cookie Store API is unavailable in jsdom
  document.cookie = "dc_xsrf=test-token";
};

const sessionWithHandle = {
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

const sessionCashOnly = { ...sessionWithHandle, payPalHandleSet: false, payPalHandle: null };

describe("SettingsPage", () => {
  it("zeigt die drei Bereiche mit dem aktuellen Anzeigenamen", async () => {
    mswServer.use(http.get("*/api/auth/me", () => HttpResponse.json(sessionWithHandle)));

    const { findByText, findByDisplayValue } = renderApp({ initialPath: "/einstellungen" });

    expect(await findByText("Identität")).toBeInTheDocument();
    expect(await findByText("Geld kassieren")).toBeInTheDocument();
    expect(await findByText("Sicherheit")).toBeInTheDocument();
    // The display-name field is seeded from the session.
    expect(await findByDisplayValue("Markus Wagner")).toBeInTheDocument();
  });

  it("bietet 'PayPal-Name entfernen' nur an, wenn ein Handle gesetzt ist", async () => {
    mswServer.use(http.get("*/api/auth/me", () => HttpResponse.json(sessionCashOnly)));

    const { findByText, queryByRole } = renderApp({ initialPath: "/einstellungen" });

    // Wait for the page to render before asserting the action's absence.
    await findByText("Geld kassieren");
    expect(queryByRole("button", { name: "PayPal-Name entfernen" })).toBeNull();
  });

  it("entfernt den PayPal-Namen nach Bestätigung (leerer Body) und schließt den Dialog", async () => {
    seedXsrfCookie();
    let receivedBody: unknown = null;
    mswServer.use(
      http.get("*/api/auth/me", () => HttpResponse.json(sessionWithHandle)),
      http.put("*/api/profile/paypal-handle", async ({ request }) => {
        receivedBody = await request.json();
        return HttpResponse.json({ payPalHandle: null, payPalHandleSet: false });
      }),
    );
    const user = userEvent.setup();
    const { findByRole, findByText } = renderApp({ initialPath: "/einstellungen" });

    await user.click(await findByRole("button", { name: "PayPal-Name entfernen" }));
    // Confirm dialog spells out the cash-only consequence.
    expect(await findByText(/in bar bezahlt/i)).toBeInTheDocument();
    await user.click(await findByRole("button", { name: "Entfernen" }));

    await waitFor(() => {
      expect(receivedBody).toEqual({ payPalHandle: null });
    });
  });

  it("navigiert über 'Passwort ändern' nach /passwort-aendern", async () => {
    mswServer.use(http.get("*/api/auth/me", () => HttpResponse.json(sessionWithHandle)));

    const user = userEvent.setup();
    const { findByRole, router } = renderApp({ initialPath: "/einstellungen" });

    await user.click(await findByRole("button", { name: "Passwort ändern" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/passwort-aendern");
    });
  });
});
