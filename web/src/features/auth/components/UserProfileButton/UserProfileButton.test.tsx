import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import type { Dashboard } from "@/features/home";
import { mswServer } from "@/test/mswServer";
import { renderApp } from "@/test/renderApp";

// Cookie the apiClient reads to echo as the X-XSRF-TOKEN header on the logout
// POST. Direct assignment mirrors the browser; the Cookie Store API is absent
// in jsdom.
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

const closedDashboard: Dashboard = {
  firstName: "Markus",
  displayName: "Markus Wagner",
  avatarColorHex: "#00728E",
  stats: {
    totalDoener: 0,
    totalDoenerLabel: "0",
    monthSpendCents: 0,
    monthSpendLabel: "0,00",
    openPaymentsCount: 0,
    streakWeeks: 0,
  },
  tier: {
    emoji: "🐺",
    name: "Der Knoblauch-Wolf",
    tagline: "Ohne Knoblauch geht bei dir gar nichts.",
    tags: ["Stammgast"],
    orderCount: 0,
  },
  leaderboard: { year: 2026, rows: [], doenerToNextRank: null, nextRank: null },
  day: {
    isOpen: false,
    id: null,
    synonym: null,
    pushText: null,
    cutoffLabel: null,
    participantCount: 0,
    pickupNames: [],
    iCanStillOrder: false,
    orders: [],
  },
  debts: { openCount: 0, totalCents: 0, totalLabel: "0,00", rows: [] },
  toast: null,
};

// Stateful auth fixture: `/me` reflects whether the session is live, and the
// logout endpoint flips it off — mirroring the real cookie lifecycle so the
// route guard's redirect after logout is exercised end-to-end. Returns a probe
// for whether logout was actually hit.
const useAuthenticatedHandlers = (): { logoutCalled: () => boolean } => {
  let authenticated = true;
  let loggedOut = false;
  mswServer.use(
    http.get("*/api/auth/me", () => {
      if (authenticated) {
        return HttpResponse.json(authenticatedSession);
      }
      return HttpResponse.json({ detail: "Nicht angemeldet." }, { status: 401 });
    }),
    http.get("*/api/dashboard", () => HttpResponse.json(closedDashboard)),
    http.post("*/api/auth/logout", () => {
      authenticated = false;
      loggedOut = true;
      return new HttpResponse(null, { status: 204 });
    }),
  );
  return { logoutCalled: () => loggedOut };
};

describe("UserProfileButton", () => {
  it("öffnet das Menü beim Klick auf den Avatar", async () => {
    useAuthenticatedHandlers();
    const user = userEvent.setup();
    const { findByRole } = renderApp({ initialPath: "/" });

    const trigger = await findByRole("button", { name: "Profilmenü öffnen" });
    await user.click(trigger);

    expect(await findByRole("menuitem", { name: "Passwort ändern" })).toBeInTheDocument();
    expect(await findByRole("menuitem", { name: "Abmelden" })).toBeInTheDocument();
  });

  it("meldet ab und navigiert nach /login", async () => {
    seedXsrfCookie();
    const { logoutCalled } = useAuthenticatedHandlers();
    const user = userEvent.setup();
    const { findByRole, router } = renderApp({ initialPath: "/" });

    await user.click(await findByRole("button", { name: "Profilmenü öffnen" }));
    await user.click(await findByRole("menuitem", { name: "Abmelden" }));

    await waitFor(() => {
      expect(logoutCalled()).toBe(true);
    });
    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/login");
    });
  });

  it("zeigt einen Hinweis und bleibt angemeldet, wenn das Abmelden fehlschlägt", async () => {
    seedXsrfCookie();
    mswServer.use(
      http.get("*/api/auth/me", () => HttpResponse.json(authenticatedSession)),
      http.get("*/api/dashboard", () => HttpResponse.json(closedDashboard)),
      http.post("*/api/auth/logout", () => new HttpResponse(null, { status: 500 })),
    );
    const user = userEvent.setup();
    const { findByRole, findByText, router } = renderApp({ initialPath: "/" });

    await user.click(await findByRole("button", { name: "Profilmenü öffnen" }));
    await user.click(await findByRole("menuitem", { name: "Abmelden" }));

    expect(await findByText(/Abmelden fehlgeschlagen/)).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/");
  });

  it("navigiert über 'Passwort ändern' nach /passwort-aendern", async () => {
    useAuthenticatedHandlers();
    const user = userEvent.setup();
    const { findByRole, router } = renderApp({ initialPath: "/" });

    await user.click(await findByRole("button", { name: "Profilmenü öffnen" }));
    await user.click(await findByRole("menuitem", { name: "Passwort ändern" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/passwort-aendern");
    });
  });

  it("zeigt 'Admin-Bereich' für eine Admin-Sitzung", async () => {
    mswServer.use(
      http.get("*/api/auth/me", () =>
        HttpResponse.json({ ...authenticatedSession, role: "Admin" }),
      ),
      http.get("*/api/dashboard", () => HttpResponse.json(closedDashboard)),
    );
    const user = userEvent.setup();
    const { findByRole } = renderApp({ initialPath: "/" });

    await user.click(await findByRole("button", { name: "Profilmenü öffnen" }));

    expect(await findByRole("menuitem", { name: "Admin-Bereich" })).toBeInTheDocument();
  });

  it("verbirgt 'Admin-Bereich' für eine Employee-Sitzung", async () => {
    mswServer.use(
      http.get("*/api/auth/me", () =>
        HttpResponse.json({ ...authenticatedSession, role: "Employee" }),
      ),
      http.get("*/api/dashboard", () => HttpResponse.json(closedDashboard)),
    );
    const user = userEvent.setup();
    const { findByRole, queryByRole } = renderApp({ initialPath: "/" });

    await user.click(await findByRole("button", { name: "Profilmenü öffnen" }));
    // The change-password item proves the menu is open before asserting absence.
    await findByRole("menuitem", { name: "Passwort ändern" });

    expect(queryByRole("menuitem", { name: "Admin-Bereich" })).not.toBeInTheDocument();
  });

  it("navigiert über 'Admin-Bereich' nach /admin", async () => {
    mswServer.use(
      http.get("*/api/auth/me", () =>
        HttpResponse.json({ ...authenticatedSession, role: "Admin" }),
      ),
      http.get("*/api/dashboard", () => HttpResponse.json(closedDashboard)),
    );
    const user = userEvent.setup();
    const { findByRole, router } = renderApp({ initialPath: "/" });

    await user.click(await findByRole("button", { name: "Profilmenü öffnen" }));
    await user.click(await findByRole("menuitem", { name: "Admin-Bereich" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/admin");
    });
  });
});
