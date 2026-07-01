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
      tierEmoji: "🐺",
    },
    {
      rank: 2,
      userId: "bbbb",
      displayName: "Lukas Brandt",
      avatarColorHex: "#00728E",
      count: 119,
      isMe: false,
      medal: "🥈",
      tierEmoji: "🦅",
    },
    {
      rank: 3,
      userId: "cccc",
      displayName: "Sara Yılmaz",
      avatarColorHex: "#ED701C",
      count: 97,
      isMe: false,
      medal: "🥉",
      tierEmoji: null,
    },
    {
      rank: 4,
      userId: "11111111-1111-1111-1111-111111111111",
      displayName: "Markus Wagner",
      avatarColorHex: "#C90023",
      count: 91,
      isMe: true,
      medal: null,
      tierEmoji: "🐎",
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
  pushText: 'Achtung Kollegen — heute wird ein „Drehspieß-Tasche" organisiert! Wer ist dabei?',
  // Ordering is open → no cutoff yet (the collector sets it on close, never
  // time-based). Stays null until isOrderingClosed flips to true.
  cutoffLabel: null,
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
  printLines: [],
  printSummary: [],
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
  printLines: [],
  printSummary: [],
};

// Read-only settled-payment history (GET /api/debts/history). Newest-settled
// first; `amountLabel` already carries " €" (new-endpoint convention).
const paymentHistory = {
  payments: [
    {
      personName: "Lukas Brandt",
      initials: "LB",
      avatarColorHex: "#00728E",
      amountCents: 760,
      amountLabel: "7,60 €",
      settledAt: "2026-06-12T10:15:00Z",
      reason: "Dürüm-Schulden",
    },
    {
      personName: "Sara Yılmaz",
      initials: "SY",
      avatarColorHex: "#ED701C",
      amountCents: 420,
      amountLabel: "4,20 €",
      settledAt: "2026-06-05T09:40:00Z",
      reason: "Pommes-Schulden",
    },
  ],
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

// Empty receivables payload — the "Was mir noch zusteht" card fetches this
// independently of the dashboard aggregate; default to empty so it renders
// nothing (its own dedicated test overrides this handler).
const emptyReceivables = {
  openCount: 0,
  openTotalCents: 0,
  openTotalLabel: "0,00 €",
  settledCount: 0,
  settledTotalCents: 0,
  settledTotalLabel: "0,00 €",
  rows: [],
};

const useDashboardHandlers = (dashboard: Dashboard): void => {
  mswServer.use(
    http.get("*/api/auth/me", () => HttpResponse.json(authenticatedSession)),
    http.get("*/api/dashboard", () => HttpResponse.json(dashboard)),
    // The "Meine letzten Zahlungen" card fetches this independently of the
    // dashboard aggregate; default to empty so it renders nothing.
    http.get("*/api/debts/history", () => HttpResponse.json({ payments: [] })),
    // The "Was mir noch zusteht" card likewise self-fetches; default to empty.
    http.get("*/api/debts/receivables", () => HttpResponse.json(emptyReceivables)),
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

  it("zeigt bei offener Bestellung KEINE 'Bestellschluss'-Zeile", async () => {
    useDashboardHandlers(buildDashboard());
    const { findByText, queryByText } = renderApp({ initialPath: "/" });

    // wait for the open-day card, then assert the cutoff line is absent
    expect(await findByText("Döner-Tag läuft")).toBeInTheDocument();
    expect(queryByText(/Bestellschluss/)).not.toBeInTheDocument();
  });

  it("zeigt nach geschlossener Bestellung die 'Bestellschluss'-Zeile mit der Schluss-Uhrzeit", async () => {
    useDashboardHandlers(
      buildDashboard({ day: { ...openDay, isOrderingClosed: true, cutoffLabel: "12:47" } }),
    );
    const { findByText } = renderApp({ initialPath: "/" });

    expect(await findByText("Bestellschluss 12:47 Uhr")).toBeInTheDocument();
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
    // each person's Döner-Tier glyph renders next to their name (🐎 Packesel
    // for the caller — distinct from the 🐺 on the tier card above).
    expect(await findByText("🐎")).toBeInTheDocument();
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

  it("zeigt auf der offenen Tag-Karte KEINEN PayPal-Link an den Abholer (Zahlung läuft erst nach Abschluss)", async () => {
    // B-2: the open-day pay path is gone — even when the caller owes the Abholer
    // (own order, foreign Abholer with a PayPal handle) no pay link/button shows.
    useDashboardHandlers(
      buildDashboard({
        day: { ...openDay, orders: [{ ...openDay.orders[1], isMine: true }, ...openDay.orders] },
      }),
    );
    const { findByText, queryByRole } = renderApp({ initialPath: "/" });

    expect(await findByText("Döner-Tag läuft")).toBeInTheDocument();
    expect(queryByRole("button", { name: /Jetzt an Lukas Brandt zahlen/ })).not.toBeInTheDocument();
    expect(queryByRole("link", { name: /Jetzt an Lukas Brandt zahlen/ })).not.toBeInTheDocument();
  });

  it("bietet die Übernahme an, solange die Bestellung offen ist (eigene Bestellung, fremder Abholer)", async () => {
    // Caller has an own order (isMine) and a foreign Abholer is set → they may take over.
    useDashboardHandlers(
      buildDashboard({
        day: { ...openDay, orders: [{ ...openDay.orders[1], isMine: true }, ...openDay.orders] },
      }),
    );
    const { findByRole } = renderApp({ initialPath: "/" });

    expect(await findByRole("button", { name: /übernehme die Abholung/i })).toBeInTheDocument();
  });

  it("blendet den Übernahme-Button aus, sobald die Bestellung geschlossen ist", async () => {
    // B-2: take-over closes when ordering locks — the Abholer is then final.
    useDashboardHandlers(
      buildDashboard({
        day: {
          ...openDay,
          isOrderingClosed: true,
          iCanStillOrder: false,
          orders: [{ ...openDay.orders[1], isMine: true }, ...openDay.orders],
        },
      }),
    );
    const { findByText, queryByRole } = renderApp({ initialPath: "/" });

    expect(await findByText("Döner-Tag läuft")).toBeInTheDocument();
    expect(queryByRole("button", { name: /übernehme die Abholung/i })).not.toBeInTheDocument();
  });

  it("zeigt keinen Abholer-Zahllink, wenn noch kein Abholer feststeht", async () => {
    useDashboardHandlers(buildDashboard({ day: { ...openDay, abholer: null } }));
    const { findByText, queryByRole } = renderApp({ initialPath: "/" });

    // wait for the open-day card to render before asserting absence
    expect(await findByText("Döner-Tag läuft")).toBeInTheDocument();
    expect(queryByRole("button", { name: /zahlen/ })).not.toBeInTheDocument();
    expect(queryByRole("link", { name: /zahlen/ })).not.toBeInTheDocument();
  });

  it("zeigt einem Kollegen ohne eigene Bestellung KEINEN Übernahme-Button (er schuldet nichts)", async () => {
    // Bug #5: a non-orderer owes the Abholer nothing → the take-over button stays
    // hidden. All seed orders are isMine: false.
    useDashboardHandlers(buildDashboard({ day: { ...openDay } }));
    const { findByText, queryByRole } = renderApp({ initialPath: "/" });

    expect(await findByText("Döner-Tag läuft")).toBeInTheDocument();
    expect(queryByRole("button", { name: /zahlen/ })).not.toBeInTheDocument();
    expect(queryByRole("link", { name: /zahlen/ })).not.toBeInTheDocument();
    expect(queryByRole("button", { name: /übernehmen/i })).not.toBeInTheDocument();
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
    expect(queryByRole("button", { name: "Tag abschließen & abrechnen" })).not.toBeInTheDocument();
    // A non-admin non-collector also gets no admin force-end button.
    expect(queryByRole("button", { name: "Döner-Tag abbrechen" })).not.toBeInTheDocument();
  });

  it("zeigt einem Nicht-Abholer ihre rote Bestell-CTA und keinen Drucken-Button", async () => {
    useDashboardHandlers(buildDashboard({ day: { ...openDay, amICollector: false } }));
    const { findByRole, queryByRole } = renderApp({ initialPath: "/" });

    // The single order CTA is the red primary for a non-collector.
    expect(await findByRole("button", { name: /Meine Bestellung abgeben/ })).toBeInTheDocument();
    // The print list is collector-only — a non-collector never sees it.
    expect(queryByRole("button", { name: "Bestellliste drucken" })).not.toBeInTheDocument();
  });

  it("zeigt dem Abholer genau eine rote Schließen-CTA, eine navy-Bearbeiten-CTA und den Drucken-Button", async () => {
    useDashboardHandlers(
      buildDashboard({ day: { ...openDay, amICollector: true, isOrderingClosed: false } }),
    );
    const { findByRole } = renderApp({ initialPath: "/" });

    // The collector's close-ordering action and a print button both show.
    expect(await findByRole("button", { name: "Bestellung schließen" })).toBeInTheDocument();
    expect(await findByRole("button", { name: "Bestellliste drucken" })).toBeInTheDocument();

    // Their own order CTA is the calmer navy secondary (the close action is the
    // only red primary on the card).
    const editCta = await findByRole("button", { name: /Meine Bestellung abgeben/ });
    expect(editCta).toBeInTheDocument();
    expect(editCta.className).toContain("MuiButton-outlined");
  });

  it("lässt einen Admin den Döner-Tag nach Bestätigung force-enden (verwirft Bestellungen, keine Schulden)", async () => {
    let forceEndHit = false;
    mswServer.use(
      http.get("*/api/auth/me", () =>
        HttpResponse.json({ ...authenticatedSession, role: "Admin" }),
      ),
      http.get("*/api/debts/history", () => HttpResponse.json({ payments: [] })),
      http.get("*/api/debts/receivables", () => HttpResponse.json(emptyReceivables)),
      http.get("*/api/dashboard", () =>
        HttpResponse.json(buildDashboard({ day: { ...openDay, amICollector: false } })),
      ),
      http.post("*/api/order-days/day-1/force-end", () => {
        forceEndHit = true;
        return HttpResponse.json({ day: {}, removedOrders: 2 });
      }),
    );

    const { findByRole } = renderApp({ initialPath: "/" });
    const user = userEvent.setup();

    // The destructive action confirms before firing.
    await user.click(await findByRole("button", { name: "Döner-Tag abbrechen" }));
    await user.click(await findByRole("button", { name: "Ja, abbrechen" }));

    await waitFor(() => {
      expect(forceEndHit).toBe(true);
    });
  });

  it("lässt auch den Abholer (Nicht-Admin) den Döner-Tag nach Bestätigung force-enden", async () => {
    // Item #13: the day's collector sees the force-end button too — the backend authorizes
    // admin OR collector. The session here is a plain employee (non-admin) who is amICollector.
    let forceEndHit = false;
    mswServer.use(
      http.get("*/api/auth/me", () => HttpResponse.json(authenticatedSession)),
      http.get("*/api/debts/history", () => HttpResponse.json({ payments: [] })),
      http.get("*/api/debts/receivables", () => HttpResponse.json(emptyReceivables)),
      http.get("*/api/dashboard", () =>
        HttpResponse.json(buildDashboard({ day: { ...openDay, amICollector: true } })),
      ),
      http.post("*/api/order-days/day-1/force-end", () => {
        forceEndHit = true;
        return HttpResponse.json({ day: {}, removedOrders: 2 });
      }),
    );

    const { findByRole } = renderApp({ initialPath: "/" });
    const user = userEvent.setup();

    await user.click(await findByRole("button", { name: "Döner-Tag abbrechen" }));
    await user.click(await findByRole("button", { name: "Ja, abbrechen" }));

    await waitFor(() => {
      expect(forceEndHit).toBe(true);
    });
  });

  it("beschriftet die Bestell-CTA als 'ändern', wenn der Nutzer schon bestellt hat", async () => {
    // One order belongs to the caller (isMine) → the CTA becomes the discoverable edit entry point.
    useDashboardHandlers(
      buildDashboard({
        day: { ...openDay, orders: [{ ...openDay.orders[0], isMine: true }] },
      }),
    );
    const { findByRole, queryByRole } = renderApp({ initialPath: "/" });

    expect(await findByRole("button", { name: "Meine Bestellung ändern" })).toBeInTheDocument();
    expect(queryByRole("button", { name: "Meine Bestellung abgeben" })).not.toBeInTheDocument();
  });

  it("zeigt dem Abholer bei offener Bestellung 'Bestellung schließen' und feuert den richtigen POST", async () => {
    let closeOrderingHit = false;
    let closeDayHit = false;
    let dashboardFetches = 0;
    mswServer.use(
      http.get("*/api/auth/me", () => HttpResponse.json(authenticatedSession)),
      http.get("*/api/debts/history", () => HttpResponse.json({ payments: [] })),
      http.get("*/api/debts/receivables", () => HttpResponse.json(emptyReceivables)),
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
    expect(queryByRole("button", { name: "Tag abschließen & abrechnen" })).not.toBeInTheDocument();
    const fetchesBefore = dashboardFetches;
    // The close action confirms before firing.
    await user.click(await findByRole("button", { name: "Bestellung schließen" }));
    await user.click(await findByRole("button", { name: "Ja, Bestellung schließen" }));

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
      http.get("*/api/debts/history", () => HttpResponse.json({ payments: [] })),
      http.get("*/api/debts/receivables", () => HttpResponse.json(emptyReceivables)),
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

    // ordering closed → the button flips to "Tag abschließen & abrechnen"
    expect(queryByRole("button", { name: "Bestellung schließen" })).not.toBeInTheDocument();
    const fetchesBefore = dashboardFetches;
    // The close action confirms before firing.
    await user.click(await findByRole("button", { name: "Tag abschließen & abrechnen" }));
    await user.click(await findByRole("button", { name: "Ja, abschließen & abrechnen" }));

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
      http.get("*/api/debts/history", () => HttpResponse.json({ payments: [] })),
      http.get("*/api/debts/receivables", () => HttpResponse.json(emptyReceivables)),
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
    await user.click(await findByRole("button", { name: "Ja, Bestellung schließen" }));

    expect(
      await findByText("Bestellung konnte nicht geschlossen werden, Chef."),
    ).toBeInTheDocument();
  });

  it("zeigt eine deutsche Fehlermeldung, wenn der Tag-Schluss mit 403 fehlschlägt", async () => {
    mswServer.use(
      http.get("*/api/auth/me", () => HttpResponse.json(authenticatedSession)),
      http.get("*/api/debts/history", () => HttpResponse.json({ payments: [] })),
      http.get("*/api/debts/receivables", () => HttpResponse.json(emptyReceivables)),
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

    await user.click(await findByRole("button", { name: "Tag abschließen & abrechnen" }));
    await user.click(await findByRole("button", { name: "Ja, abschließen & abrechnen" }));

    expect(
      await findByText("Döner-Tag konnte nicht geschlossen werden, Chef."),
    ).toBeInTheDocument();
  });

  it("feuert nach Bestätigung den Settle-POST für die Schuld und invalidiert das Dashboard", async () => {
    let settledDebtId: string | null = null;
    let dashboardFetches = 0;
    mswServer.use(
      http.get("*/api/auth/me", () => HttpResponse.json(authenticatedSession)),
      http.get("*/api/debts/history", () => HttpResponse.json({ payments: [] })),
      http.get("*/api/debts/receivables", () => HttpResponse.json(emptyReceivables)),
      http.get("*/api/dashboard", () => {
        dashboardFetches += 1;
        return HttpResponse.json(buildDashboard());
      }),
      http.post("*/api/debts/:debtId/settle", ({ params }) => {
        settledDebtId = String(params.debtId);
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { findByText, findAllByRole, findByRole } = renderApp({ initialPath: "/" });
    const user = userEvent.setup();

    // wait for the debt rows to render, then open the confirm dialog on row 1
    expect(await findByText("Offene Zahlungen")).toBeInTheDocument();
    const settleButtons = await findAllByRole("button", { name: "Erledigt" });
    expect(settleButtons).toHaveLength(2);
    const fetchesBefore = dashboardFetches;
    await user.click(settleButtons[0]);

    // confirmation makes the one-way nature explicit before firing
    await user.click(await findByRole("button", { name: "Hab ich bezahlt" }));

    await waitFor(() => {
      expect(settledDebtId).toBe("debt-1");
    });
    // onSuccess invalidates dashboardKeys.all → a refetch fires
    await waitFor(() => {
      expect(dashboardFetches).toBeGreaterThan(fetchesBefore);
    });
  });

  it("deaktiviert die Erledigt-Bestätigung, solange der Settle läuft", async () => {
    let releaseSettle: () => void = () => {};
    mswServer.use(
      http.get("*/api/auth/me", () => HttpResponse.json(authenticatedSession)),
      http.get("*/api/debts/history", () => HttpResponse.json({ payments: [] })),
      http.get("*/api/debts/receivables", () => HttpResponse.json(emptyReceivables)),
      http.get("*/api/dashboard", () => HttpResponse.json(buildDashboard())),
      http.post("*/api/debts/:debtId/settle", async () => {
        await new Promise<void>((resolve) => {
          releaseSettle = resolve;
        });
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { findByText, findAllByRole, findByRole } = renderApp({ initialPath: "/" });
    const user = userEvent.setup();

    expect(await findByText("Offene Zahlungen")).toBeInTheDocument();
    const settleButtons = await findAllByRole("button", { name: "Erledigt" });
    await user.click(settleButtons[0]);

    const confirm = await findByRole("button", { name: "Hab ich bezahlt" });
    await user.click(confirm);

    // mutation hangs until we release → confirm + row pill disable meanwhile
    await waitFor(() => {
      expect(confirm).toBeDisabled();
    });
    expect(settleButtons[0]).toBeDisabled();

    releaseSettle();
  });

  it("zeigt statt eines toten PayPal-Buttons einen 'Bar zahlen'-Hinweis, wenn die Schuld keine PayPal-URL hat", async () => {
    useDashboardHandlers(
      buildDashboard({
        // close the day so the open-day card's working Abholer-PayPal link is
        // gone — leaving exactly the debt row under test.
        day: closedDay,
        debts: {
          ...baseDebts,
          rows: [{ ...baseDebts.rows[0], paypalUrl: null }],
          openCount: 1,
        },
      }),
    );
    const { findByText, queryByRole } = renderApp({ initialPath: "/" });

    expect(await findByText("Offene Zahlungen")).toBeInTheDocument();
    // null paypalUrl → no PayPal pill at all, just a muted "Bar zahlen" hint
    expect(await findByText("Bar zahlen")).toBeInTheDocument();
    expect(queryByRole("button", { name: "PayPal" })).not.toBeInTheDocument();
    expect(queryByRole("link", { name: "PayPal" })).not.toBeInTheDocument();
  });

  it("zeigt die letzten Zahlungen mit Name, Betrag und Datum, neueste zuerst", async () => {
    mswServer.use(
      http.get("*/api/auth/me", () => HttpResponse.json(authenticatedSession)),
      http.get("*/api/dashboard", () => HttpResponse.json(buildDashboard())),
      http.get("*/api/debts/history", () => HttpResponse.json(paymentHistory)),
      http.get("*/api/debts/receivables", () => HttpResponse.json(emptyReceivables)),
    );
    const { findByText, getByText } = renderApp({ initialPath: "/" });

    // header + both creditor rows
    expect(await findByText("Meine letzten Zahlungen")).toBeInTheDocument();
    expect(getByText("Dürüm-Schulden")).toBeInTheDocument();
    expect(getByText("Pommes-Schulden")).toBeInTheDocument();

    // amountLabel rendered AS-IS (already carries " €" — not appended twice)
    const amount = getByText("7,60 €");
    expect(amount).toBeInTheDocument();
    expect(amount.textContent).not.toContain("€ €");

    // short German settle date derived from the ISO timestamp
    expect(getByText("12. Juni 2026")).toBeInTheDocument();
    expect(getByText("5. Juni 2026")).toBeInTheDocument();

    // newest-settled first: the 7,60 € row precedes the 4,20 € row in the DOM
    const newest = getByText("7,60 €");
    const oldest = getByText("4,20 €");
    expect(newest.compareDocumentPosition(oldest) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    // read-only history → no PayPal/settle controls inside the card
    expect(amount.closest("div")?.querySelector("a")).toBeNull();
  });

  it("zeigt die Zahlungs-Historie-Karte nicht, wenn es keine Zahlungen gibt", async () => {
    mswServer.use(
      http.get("*/api/auth/me", () => HttpResponse.json(authenticatedSession)),
      http.get("*/api/dashboard", () => HttpResponse.json(buildDashboard())),
      http.get("*/api/debts/history", () => HttpResponse.json({ payments: [] })),
      http.get("*/api/debts/receivables", () => HttpResponse.json(emptyReceivables)),
    );
    const { findByText, queryByText } = renderApp({ initialPath: "/" });

    // wait for the page to settle, then assert the card is absent
    expect(await findByText("Offene Zahlungen")).toBeInTheDocument();
    expect(queryByText("Meine letzten Zahlungen")).not.toBeInTheDocument();
  });

  it("zeigt den PayPal-Hinweis, wenn der Nutzer kein PayPal hinterlegt hat", async () => {
    mswServer.use(
      http.get("*/api/auth/me", () =>
        HttpResponse.json({ ...authenticatedSession, payPalHandleSet: false, payPalHandle: null }),
      ),
      http.get("*/api/dashboard", () => HttpResponse.json(buildDashboard())),
      http.get("*/api/debts/history", () => HttpResponse.json({ payments: [] })),
      http.get("*/api/debts/receivables", () => HttpResponse.json(emptyReceivables)),
    );
    const { findByText } = renderApp({ initialPath: "/" });

    expect(await findByText("Kein PayPal hinterlegt, Chef")).toBeInTheDocument();
  });

  it("blendet den PayPal-Hinweis aus, wenn ein PayPal-Handle hinterlegt ist", async () => {
    // The default session has payPalHandleSet: true.
    useDashboardHandlers(buildDashboard());
    const { findByText, queryByText } = renderApp({ initialPath: "/" });

    expect(await findByText("Döner-Tag läuft")).toBeInTheDocument();
    expect(queryByText("Kein PayPal hinterlegt, Chef")).not.toBeInTheDocument();
  });

  it("ordnet die offenen Zahlungen direkt unter den Döner-Tag, vor Tier und Stats", async () => {
    useDashboardHandlers(buildDashboard());
    const { findByText, getByText } = renderApp({ initialPath: "/" });

    const openPayments = await findByText("Offene Zahlungen");
    const stats = getByText("Döner-Überwachung");
    const tier = getByText("Dein Döner-Tier");

    // OpenPaymentsCard precedes both the tier and the stats sections in the DOM.
    expect(
      openPayments.compareDocumentPosition(stats) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      openPayments.compareDocumentPosition(tier) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("macht die 'Offen'-Kachel nur tappbar, wenn die Anzahl > 0 ist", async () => {
    useDashboardHandlers(buildDashboard());
    const { findByText } = renderApp({ initialPath: "/" });

    // openPaymentsCount is 2 → the tile is a button.
    const openTile = await findByText("Offen");
    expect(openTile.closest("button")).not.toBeNull();
  });

  it("lässt die 'Offen'-Kachel inert, wenn keine offenen Zahlungen bestehen", async () => {
    useDashboardHandlers(
      buildDashboard({
        stats: { ...baseStats, openPaymentsCount: 0 },
        debts: { openCount: 0, totalCents: 0, totalLabel: "0,00", rows: [] },
      }),
    );
    const { findByText } = renderApp({ initialPath: "/" });

    const openTile = await findByText("Offen");
    expect(openTile.closest("button")).toBeNull();
  });
});
