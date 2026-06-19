import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import type { Dashboard } from "@/features/home";
import { mswServer } from "@/test/mswServer";
import { renderApp } from "@/test/renderApp";

const authenticatedSession = {
  userId: "11111111-1111-1111-1111-111111111111",
  displayName: "Markus Wagner",
  firstName: "Markus",
  initials: "MW",
  avatarColorHex: "#C90023",
  role: "employee",
  payPalHandleSet: true,
  payPalHandle: "MarkusW",
  mustChangePassword: false,
};

const baseStats = {
  totalDoener: 1337,
  totalDoenerLabel: "1.337",
  monthSpendCents: 31250,
  monthSpendLabel: "312,50",
  openPaymentsCount: 2,
  streakWeeks: 14,
};

const baseTier = {
  emoji: "🐺",
  name: "Der Knoblauch-Wolf",
  tagline: "Ohne Knoblauch geht bei dir gar nichts.",
  tags: ["Knoblauch-süchtig", "Stammgast"],
  orderCount: 12,
};

const baseLeaderboard = {
  year: 2026,
  rows: [
    {
      rank: 1,
      userId: "aaaa",
      displayName: "Tobias Klein",
      avatarColorHex: "#45B8A1",
      count: 142,
      isMe: false,
      medal: "🥇",
    },
    {
      rank: 2,
      userId: "bbbb",
      displayName: "Lukas Brandt",
      avatarColorHex: "#00728E",
      count: 119,
      isMe: false,
      medal: "🥈",
    },
    {
      rank: 3,
      userId: "cccc",
      displayName: "Sara Yılmaz",
      avatarColorHex: "#ED701C",
      count: 97,
      isMe: false,
      medal: "🥉",
    },
    {
      rank: 4,
      userId: "11111111-1111-1111-1111-111111111111",
      displayName: "Markus Wagner",
      avatarColorHex: "#C90023",
      count: 91,
      isMe: true,
      medal: null,
    },
  ],
  doenerToNextRank: 6,
  nextRank: 3,
};

const baseDebts = {
  openCount: 2,
  totalCents: 1150,
  totalLabel: "11,50",
  rows: [
    {
      id: "debt-1",
      creditorName: "Lukas Brandt",
      creditorAvatarColorHex: "#00728E",
      reason: "Döner-Tag",
      dayLabel: "letzte Woche",
      amountCents: 850,
      amountLabel: "8,50",
      paypalUrl: "https://paypal.me/LukasBrandtHB/8.50EUR",
    },
    {
      id: "debt-2",
      creditorName: "Sara Yılmaz",
      creditorAvatarColorHex: "#ED701C",
      reason: "Ayran-Schulden",
      dayLabel: null,
      amountCents: 300,
      amountLabel: "3,00",
      paypalUrl: "https://paypal.me/SaraYHB/3.00EUR",
    },
  ],
};

const openDay = {
  isOpen: true as const,
  id: "day-1",
  synonym: "Drehspieß-Tasche",
  pushText:
    'Achtung Kollegen — heute wird ein „Drehspieß-Tasche" organisiert! Bestellschluss 11:30 Uhr. Wer ist dabei?',
  cutoffLabel: "11:30",
  participantCount: 3,
  pickupNames: ["Lukas Brandt"],
  iCanStillOrder: true,
  isOrderingClosed: false,
  amICollector: false,
  abholer: {
    name: "Lukas Brandt",
    initials: "LB",
    colorHex: "#00728E",
    payPalUrl: "https://paypal.me/LukasBrandtHB/7.60EUR",
  },
  orders: [
    {
      orderId: "o1",
      personName: "Lukas Brandt",
      avatarColorHex: "#00728E",
      productLabel: "Dürüm Kalb",
      description: "Knoblauch, scharf",
      priceCents: 850,
      priceLabel: "8,50",
      isMine: false,
      isPickup: true,
    },
    {
      orderId: "o2",
      personName: "Sara Yılmaz",
      avatarColorHex: "#ED701C",
      productLabel: "Pizza Salami",
      description: "Standard",
      priceCents: 900,
      priceLabel: "9,00",
      isMine: false,
      isPickup: false,
    },
    {
      orderId: "o3",
      personName: "Tobias Klein",
      avatarColorHex: "#45B8A1",
      productLabel: "Döner Hähnchen",
      description: "ohne Soße",
      priceCents: 750,
      priceLabel: "7,50",
      isMine: false,
      isPickup: false,
    },
  ],
};

const closedDay = {
  isOpen: false as const,
  id: null,
  synonym: null,
  pushText: null,
  cutoffLabel: null,
  participantCount: 0,
  pickupNames: [],
  iCanStillOrder: false,
  isOrderingClosed: false,
  amICollector: false,
  abholer: null,
  orders: [],
};

const buildDashboard = (overrides: Partial<Dashboard> = {}): Dashboard => ({
  firstName: "Markus",
  displayName: "Markus Wagner",
  avatarColorHex: "#C90023",
  stats: baseStats,
  tier: baseTier,
  leaderboard: baseLeaderboard,
  day: openDay,
  debts: baseDebts,
  toast: null,
  ...overrides,
});

const useDashboardHandlers = (dashboard: Dashboard): void => {
  mswServer.use(
    http.get("*/api/auth/me", () => HttpResponse.json(authenticatedSession)),
    http.get("*/api/dashboard", () => HttpResponse.json(dashboard)),
  );
};

describe("DashboardPage", () => {
  it("rendert die Bestellzeilen, den Abholer, '{n} dabei' und den Bestell-Button im OPEN-Zustand", async () => {
    useDashboardHandlers(buildDashboard());
    const { findByText, findByRole } = renderApp({ initialPath: "/" });

    // greeting with real first name
    expect(await findByText(/Moin, Markus/)).toBeInTheDocument();

    // running-day sub-header + count pill
    expect(await findByText("Döner-Tag läuft")).toBeInTheDocument();
    expect(await findByText("3 dabei")).toBeInTheDocument();

    // abholer line — the label plus the pickup name in the same row
    const abholerLabel = await findByText(/Abholer heute:/);
    expect(abholerLabel).toBeInTheDocument();
    expect(abholerLabel.parentElement?.textContent).toContain("Lukas Brandt");

    // order rows
    expect(await findByText("Dürüm Kalb")).toBeInTheDocument();
    expect(await findByText("Pizza Salami")).toBeInTheDocument();
    expect(await findByText("Döner Hähnchen")).toBeInTheDocument();

    // order CTA
    expect(await findByRole("button", { name: /Meine Bestellung abgeben/ })).toBeInTheDocument();
  });

  it("zeigt im CLOSED-Zustand die Eröffnungs-CTA", async () => {
    useDashboardHandlers(buildDashboard({ day: closedDay }));
    const { findByRole, findByText } = renderApp({ initialPath: "/" });

    expect(await findByText(/Heute hat noch niemand Hunger angemeldet/)).toBeInTheDocument();
    expect(await findByRole("button", { name: /Ich will heute Döner!/ })).toBeInTheDocument();
  });

  it("hebt den aktuellen Nutzer in der Bestenliste hervor und zeigt 'noch X bis Platz N'", async () => {
    useDashboardHandlers(buildDashboard());
    const { findByText } = renderApp({ initialPath: "/" });

    expect(await findByText("Döner-Bestenliste")).toBeInTheDocument();
    expect(await findByText("Tobias Klein")).toBeInTheDocument();
    // current-user highlight: name + "· du"
    expect(await findByText("Markus Wagner")).toBeInTheDocument();
    expect(await findByText("· du")).toBeInTheDocument();
    expect(await findByText(/Nur noch 6 Döner bis Platz 3/)).toBeInTheDocument();
  });

  it("zeigt für offene Schulden funktionierende PayPal-Buttons", async () => {
    useDashboardHandlers(buildDashboard());
    const { findByText, findAllByRole } = renderApp({ initialPath: "/" });

    expect(await findByText("Offene Zahlungen")).toBeInTheDocument();
    expect(await findByText("Ayran-Schulden")).toBeInTheDocument();

    const payLinks = await findAllByRole("link", { name: /PayPal/ });
    const hrefs = payLinks.map((link) => link.getAttribute("href"));
    expect(hrefs).toContain("https://paypal.me/LukasBrandtHB/8.50EUR");
    expect(hrefs).toContain("https://paypal.me/SaraYHB/3.00EUR");
  });

  it("zeigt auf der offenen Tag-Karte einen PayPal-Link an den Abholer, wenn man nicht selbst abholt", async () => {
    useDashboardHandlers(buildDashboard());
    const { findByRole } = renderApp({ initialPath: "/" });

    const payLink = await findByRole("link", { name: /Jetzt an Lukas Brandt zahlen/ });
    expect(payLink).toHaveAttribute("href", "https://paypal.me/LukasBrandtHB/7.60EUR");
  });

  it("zeigt keinen Abholer-Zahllink, wenn noch kein Abholer feststeht", async () => {
    useDashboardHandlers(buildDashboard({ day: { ...openDay, abholer: null } }));
    const { findByText, queryByRole } = renderApp({ initialPath: "/" });

    // wait for the open-day card to render before asserting absence
    expect(await findByText("Döner-Tag läuft")).toBeInTheDocument();
    expect(queryByRole("button", { name: /zahlen/ })).not.toBeInTheDocument();
    expect(queryByRole("link", { name: /zahlen/ })).not.toBeInTheDocument();
  });

  it("zeigt einen deaktivierten Abholer-Button, wenn keine PayPal-URL vorliegt", async () => {
    useDashboardHandlers(
      buildDashboard({
        day: { ...openDay, abholer: { ...openDay.abholer, payPalUrl: null } },
      }),
    );
    const { findByRole } = renderApp({ initialPath: "/" });

    const button = await findByRole("button", { name: /Jetzt an Lukas Brandt zahlen/ });
    expect(button).toBeDisabled();
    expect(button).not.toHaveAttribute("href");
  });

  it("zeigt dem Abholer selbst keinen Zahllink", async () => {
    useDashboardHandlers(buildDashboard({ day: { ...openDay, amICollector: true } }));
    const { findByText, queryByRole } = renderApp({ initialPath: "/" });

    expect(await findByText("Döner-Tag läuft")).toBeInTheDocument();
    expect(queryByRole("button", { name: /zahlen/ })).not.toBeInTheDocument();
    expect(queryByRole("link", { name: /zahlen/ })).not.toBeInTheDocument();
  });

  it("zeigt einem Nicht-Abholer keine Schließen-Buttons", async () => {
    useDashboardHandlers(buildDashboard({ day: { ...openDay, amICollector: false } }));
    const { findByText, queryByRole } = renderApp({ initialPath: "/" });

    expect(await findByText("Döner-Tag läuft")).toBeInTheDocument();
    expect(queryByRole("button", { name: "Bestellung schließen" })).not.toBeInTheDocument();
    expect(queryByRole("button", { name: "Döner-Tag schließen" })).not.toBeInTheDocument();
  });

  it("zeigt dem Abholer bei offener Bestellung 'Bestellung schließen' und feuert den richtigen POST", async () => {
    let closeOrderingHit = false;
    let closeDayHit = false;
    let dashboardFetches = 0;
    mswServer.use(
      http.get("*/api/auth/me", () => HttpResponse.json(authenticatedSession)),
      http.get("*/api/dashboard", () => {
        dashboardFetches += 1;
        return HttpResponse.json(
          buildDashboard({ day: { ...openDay, amICollector: true, isOrderingClosed: false } }),
        );
      }),
      http.post("*/api/order-days/day-1/close-ordering", () => {
        closeOrderingHit = true;
        return HttpResponse.json({ day: {} });
      }),
      http.post("*/api/order-days/day-1/close", () => {
        closeDayHit = true;
        return HttpResponse.json({ day: {}, debtsCreated: 0 });
      }),
    );

    const { findByRole, queryByRole } = renderApp({ initialPath: "/" });
    const user = userEvent.setup();

    // ordering open → only the "Bestellung schließen" button shows
    expect(queryByRole("button", { name: "Döner-Tag schließen" })).not.toBeInTheDocument();
    const fetchesBefore = dashboardFetches;
    await user.click(await findByRole("button", { name: "Bestellung schließen" }));

    await waitFor(() => {
      expect(closeOrderingHit).toBe(true);
    });
    expect(closeDayHit).toBe(false);
    // onSuccess invalidates dashboardKeys.all → a refetch fires
    await waitFor(() => {
      expect(dashboardFetches).toBeGreaterThan(fetchesBefore);
    });
  });

  it("zeigt dem Abholer nach geschlossener Bestellung 'Döner-Tag schließen' und feuert den Close-POST", async () => {
    let closeDayHit = false;
    let dashboardFetches = 0;
    mswServer.use(
      http.get("*/api/auth/me", () => HttpResponse.json(authenticatedSession)),
      http.get("*/api/dashboard", () => {
        dashboardFetches += 1;
        return HttpResponse.json(
          buildDashboard({ day: { ...openDay, amICollector: true, isOrderingClosed: true } }),
        );
      }),
      http.post("*/api/order-days/day-1/close", () => {
        closeDayHit = true;
        return HttpResponse.json({ day: {}, debtsCreated: 3 });
      }),
    );

    const { findByRole, queryByRole } = renderApp({ initialPath: "/" });
    const user = userEvent.setup();

    // ordering closed → the button flips to "Döner-Tag schließen"
    expect(queryByRole("button", { name: "Bestellung schließen" })).not.toBeInTheDocument();
    const fetchesBefore = dashboardFetches;
    await user.click(await findByRole("button", { name: "Döner-Tag schließen" }));

    await waitFor(() => {
      expect(closeDayHit).toBe(true);
    });
    await waitFor(() => {
      expect(dashboardFetches).toBeGreaterThan(fetchesBefore);
    });
  });

  it("zeigt eine deutsche Fehlermeldung, wenn das Schließen mit 409 fehlschlägt", async () => {
    mswServer.use(
      http.get("*/api/auth/me", () => HttpResponse.json(authenticatedSession)),
      http.get("*/api/dashboard", () =>
        HttpResponse.json(
          buildDashboard({ day: { ...openDay, amICollector: true, isOrderingClosed: false } }),
        ),
      ),
      http.post("*/api/order-days/day-1/close-ordering", () =>
        HttpResponse.json({ title: "Conflict" }, { status: 409 }),
      ),
    );

    const { findByRole, findByText } = renderApp({ initialPath: "/" });
    const user = userEvent.setup();

    await user.click(await findByRole("button", { name: "Bestellung schließen" }));

    expect(
      await findByText("Bestellung konnte nicht geschlossen werden, Chef."),
    ).toBeInTheDocument();
  });

  it("zeigt eine deutsche Fehlermeldung, wenn der Tag-Schluss mit 403 fehlschlägt", async () => {
    mswServer.use(
      http.get("*/api/auth/me", () => HttpResponse.json(authenticatedSession)),
      http.get("*/api/dashboard", () =>
        HttpResponse.json(
          buildDashboard({ day: { ...openDay, amICollector: true, isOrderingClosed: true } }),
        ),
      ),
      http.post("*/api/order-days/day-1/close", () =>
        HttpResponse.json({ title: "Forbidden" }, { status: 403 }),
      ),
    );

    const { findByRole, findByText } = renderApp({ initialPath: "/" });
    const user = userEvent.setup();

    await user.click(await findByRole("button", { name: "Döner-Tag schließen" }));

    expect(
      await findByText("Döner-Tag konnte nicht geschlossen werden, Chef."),
    ).toBeInTheDocument();
  });
});
