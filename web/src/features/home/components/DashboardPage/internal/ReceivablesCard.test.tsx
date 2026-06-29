import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import type { Dashboard } from "@/features/home";
import { mswServer } from "@/test/mswServer";
import { renderApp } from "@/test/renderApp";

// The "Was mir noch zusteht" card self-fetches GET /api/debts/receivables (NOT
// the dashboard aggregate). These tests drive the full dashboard route and only
// vary that one endpoint; everything else is mocked minimally so the page renders.

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

const baseDashboard: Dashboard = {
  firstName: "Markus",
  displayName: "Markus Wagner",
  avatarColorHex: "#C90023",
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
    tags: [],
    orderCount: 0,
  },
  leaderboard: { year: 2026, rows: [], doenerToNextRank: null, nextRank: null },
  day: closedDay,
  debts: { openCount: 0, totalCents: 0, totalLabel: "0,00", rows: [] },
  toast: null,
};

const emptyReceivables = {
  openCount: 0,
  openTotalCents: 0,
  openTotalLabel: "0,00 €",
  settledCount: 0,
  settledTotalCents: 0,
  settledTotalLabel: "0,00 €",
  rows: [],
};

// One open + one settled row; open first, then settled (backend order).
const mixedReceivables = {
  openCount: 1,
  openTotalCents: 850,
  openTotalLabel: "8,50 €",
  settledCount: 1,
  settledTotalCents: 420,
  settledTotalLabel: "4,20 €",
  rows: [
    {
      id: "r1",
      debtorName: "Sara Yılmaz",
      initials: "SY",
      avatarColorHex: "#ED701C",
      reason: "Döner-Tag",
      dayLabel: "letzte Woche",
      amountCents: 850,
      amountLabel: "8,50 €",
      isSettled: false,
      settledAt: null,
    },
    {
      id: "r2",
      debtorName: "Tobias Klein",
      initials: "TK",
      avatarColorHex: "#45B8A1",
      reason: "Ayran-Schulden",
      dayLabel: null,
      amountCents: 420,
      amountLabel: "4,20 €",
      isSettled: true,
      settledAt: "2026-06-12T10:15:00Z",
    },
  ],
};

interface ReceivablesPayload {
  rows: unknown[];
}

const useReceivablesHandlers = (receivables: ReceivablesPayload): void => {
  mswServer.use(
    http.get("*/api/auth/me", () => HttpResponse.json(authenticatedSession)),
    http.get("*/api/dashboard", () => HttpResponse.json(baseDashboard)),
    http.get("*/api/debts/history", () => HttpResponse.json({ payments: [] })),
    http.get("*/api/debts/receivables", () => HttpResponse.json(receivables)),
  );
};

describe("ReceivablesCard", () => {
  it("rendert nichts, wenn niemand dem Nutzer etwas schuldet", async () => {
    useReceivablesHandlers(emptyReceivables);
    const { findByText, queryByText } = renderApp({ initialPath: "/" });

    // wait for the page to settle, then assert the card is absent
    expect(await findByText(/Heute hat noch niemand Hunger angemeldet/)).toBeInTheDocument();
    expect(queryByText("Was mir noch zusteht")).not.toBeInTheDocument();
  });

  it("zeigt offene und bezahlte Zeilen mit den richtigen Chips und der offenen Summe", async () => {
    useReceivablesHandlers(mixedReceivables);
    const { findByText, getByText, getAllByText } = renderApp({ initialPath: "/" });

    // header title + open total (rendered as-is, " €" already included). The
    // single open row carries the same 8,50 € amount, so the label resolves to
    // two nodes (header total + row amount).
    expect(await findByText("Was mir noch zusteht")).toBeInTheDocument();
    expect(getAllByText("8,50 €").length).toBeGreaterThanOrEqual(2);

    // both debtor rows + the settled amount
    expect(getByText("Sara Yılmaz")).toBeInTheDocument();
    expect(getByText("Tobias Klein")).toBeInTheDocument();
    expect(getByText("4,20 €")).toBeInTheDocument();

    // reason + dayLabel combined on the open row; reason alone when no dayLabel
    expect(getByText("Döner-Tag · letzte Woche")).toBeInTheDocument();
    expect(getByText("Ayran-Schulden")).toBeInTheDocument();

    // open row → "Offen" chip (the header total uses "€", so it does not match);
    // settled row → "Bezahlt" + the short German settle date.
    expect(getAllByText("Offen").length).toBeGreaterThanOrEqual(1);
    expect(getByText("Bezahlt")).toBeInTheDocument();
    expect(getByText("12. Juni 2026")).toBeInTheDocument();
  });
});
