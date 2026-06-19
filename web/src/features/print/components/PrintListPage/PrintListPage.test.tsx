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
  openPaymentsCount: 0,
  streakWeeks: 14,
};

const baseTier = {
  emoji: "🐺",
  name: "Der Knoblauch-Wolf",
  tagline: "Ohne Knoblauch geht bei dir gar nichts.",
  tags: ["Knoblauch-süchtig"],
  orderCount: 12,
};

const baseLeaderboard = {
  year: 2026,
  rows: [],
  doenerToNextRank: null,
  nextRank: null,
};

const baseDebts = {
  openCount: 0,
  totalCents: 0,
  totalLabel: "0,00",
  rows: [],
};

// Three orders: 8,50 + 9,00 + 7,50 = 25,00 €.
const openDay = {
  isOpen: true as const,
  id: "day-1",
  synonym: "Drehspieß-Tasche",
  pushText: null,
  cutoffLabel: "11:30",
  participantCount: 3,
  pickupNames: ["Lukas Brandt"],
  iCanStillOrder: true,
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

describe("PrintListPage", () => {
  it("rendert die Bestellzeilen, den Abholer und die korrekte Gesamtsumme", async () => {
    useDashboardHandlers(buildDashboard());
    const { findByText, findByRole, getByText, getAllByText } = renderApp({
      initialPath: "/druck",
    });

    // header: title with the day's German date + Abholer line
    expect(await findByText(/Döner-Tag/)).toBeInTheDocument();
    const abholer = getByText(/Abholer:/);
    expect(abholer.parentElement?.textContent).toContain("Lukas Brandt");

    // one row per order — person, product and detail all present. "Lukas Brandt"
    // also appears in the Abholer line, so it resolves to two nodes.
    expect(getAllByText("Lukas Brandt").length).toBeGreaterThanOrEqual(1);
    expect(getByText("Sara Yılmaz")).toBeInTheDocument();
    expect(getByText("Dürüm Kalb")).toBeInTheDocument();
    expect(getByText("Knoblauch, scharf")).toBeInTheDocument();
    expect(getByText("Pizza Salami")).toBeInTheDocument();
    expect(getByText("Döner Hähnchen")).toBeInTheDocument();

    // grand total: 8,50 + 9,00 + 7,50 = 25,00 €
    expect(getByText("Gesamt")).toBeInTheDocument();
    expect(getByText("25,00 €")).toBeInTheDocument();

    // the Drucken CTA is present
    expect(await findByRole("button", { name: /Drucken/ })).toBeInTheDocument();
  });

  it("zeigt einen Hinweis, wenn kein Döner-Tag läuft", async () => {
    useDashboardHandlers(buildDashboard({ day: closedDay }));
    const { findByText } = renderApp({ initialPath: "/druck" });

    expect(await findByText(/Heute läuft kein Döner-Tag/)).toBeInTheDocument();
  });
});
