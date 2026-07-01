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
  // The server-built print sheet: numbered per-package lines in article-type order + shop summary.
  printLines: [
    {
      number: 1,
      section: "Döner",
      personName: "Tobias Klein",
      productLabel: "Döner Hähnchen",
      description: "ohne Soße",
      quantity: 1,
      lineTotalCents: 750,
      isPickup: false,
    },
    {
      number: 2,
      section: "Dürüm",
      personName: "Lukas Brandt",
      productLabel: "Dürüm Kalb",
      description: "Knoblauch, scharf",
      quantity: 1,
      lineTotalCents: 850,
      isPickup: true,
    },
    {
      number: 3,
      section: "Pizza",
      personName: "Sara Yılmaz",
      productLabel: "Pizza Salami",
      description: "Standard",
      quantity: 1,
      lineTotalCents: 900,
      isPickup: false,
    },
  ],
  printSummary: [
    { label: "Döner Hähnchen · ohne Soße", quantity: 1 },
    { label: "Dürüm Kalb · Knoblauch, scharf", quantity: 1 },
    { label: "Pizza Salami", quantity: 1 },
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
  printLines: [],
  printSummary: [],
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
    // The /druck route reads the client config (for the e-mail-PDF flag) and the
    // PWA gate does too; default emailPdfEnabled off so the e-mail button is absent.
    http.get("*/api/config", () =>
      HttpResponse.json({ pwaGateEnabled: false, registrationMode: 1, emailPdfEnabled: false }),
    ),
  );
};

// D-4 wiring: vary the client-config `emailPdfEnabled` flag (threaded in from
// the /druck route) and the session's `workEmail`. A non-null work e-mail means
// the caller may e-mail the list to themselves.
interface EmailHandlerOptions {
  emailPdfEnabled: boolean;
  workEmail: string | null;
}

const useEmailHandlers = ({ emailPdfEnabled, workEmail }: EmailHandlerOptions): void => {
  mswServer.use(
    http.get("*/api/auth/me", () => HttpResponse.json({ ...authenticatedSession, workEmail })),
    http.get("*/api/dashboard", () => HttpResponse.json(buildDashboard())),
    http.get("*/api/config", () =>
      HttpResponse.json({ pwaGateEnabled: false, registrationMode: 1, emailPdfEnabled }),
    ),
  );
};

describe("PrintListPage", () => {
  it("rendert die Bestellzeilen, den Abholer und die korrekte Gesamtsumme", async () => {
    useDashboardHandlers(buildDashboard());
    const { findByText, findByRole, getByText, getAllByText, queryByText } = renderApp({
      initialPath: "/druck",
    });

    // header: title with the day's German date + Abholer line
    expect(await findByText(/Döner-Tag/)).toBeInTheDocument();
    const abholer = getByText(/Abholer:/);
    expect(abholer.parentElement?.textContent).toContain("Lukas Brandt");

    // the printed subline shows only the order count — the playful synonym is
    // dropped on the printed sheet (it stays on the dashboard screen).
    expect(getByText("3 Bestellungen")).toBeInTheDocument();
    expect(queryByText(/Drehspieß-Tasche/)).not.toBeInTheDocument();

    // one numbered line per package — person, product and detail all present. "Lukas Brandt"
    // also appears in the Abholer line, so it resolves to two nodes.
    expect(getAllByText("Lukas Brandt").length).toBeGreaterThanOrEqual(1);
    expect(getByText("Sara Yılmaz")).toBeInTheDocument();
    expect(getByText("Dürüm Kalb")).toBeInTheDocument();
    expect(getByText("Knoblauch, scharf")).toBeInTheDocument();

    // article-type section headers group the sheet (Döner appears both as a header and inside the
    // "Döner Hähnchen" summary/label, so it resolves to multiple nodes).
    expect(getAllByText("Döner").length).toBeGreaterThanOrEqual(1);
    expect(getByText("Dürüm")).toBeInTheDocument();
    expect(getByText("Pizza")).toBeInTheDocument();

    // "für die Theke" grouped shop summary + its numbering hint.
    expect(getByText(/Für die Theke/)).toBeInTheDocument();
    expect(getByText("1× Pizza Salami")).toBeInTheDocument();
    expect(getByText(/Nummer steht auf jeder Tüte/)).toBeInTheDocument();

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

  it("zeigt den Mail-Button, wenn das Feature aktiv ist und eine Arbeits-Mail hinterlegt ist", async () => {
    useEmailHandlers({ emailPdfEnabled: true, workEmail: "markus@schulz.st" });
    const { findByRole, queryByText } = renderApp({ initialPath: "/druck" });

    expect(
      await findByRole("button", { name: "Liste an meine Mail schicken" }),
    ).toBeInTheDocument();
    // No settings hint when the work e-mail is already on file.
    expect(queryByText(/Hinterlege zuerst deine Arbeits-Mail/)).not.toBeInTheDocument();
  });

  it("zeigt statt des Buttons einen Einstellungs-Hinweis, wenn keine Arbeits-Mail hinterlegt ist", async () => {
    useEmailHandlers({ emailPdfEnabled: true, workEmail: null });
    const { findByText, findByRole, queryByRole } = renderApp({ initialPath: "/druck" });

    expect(await findByText(/Hinterlege zuerst deine Arbeits-Mail/)).toBeInTheDocument();
    expect(await findByRole("link", { name: "Zu den Einstellungen" })).toBeInTheDocument();
    expect(queryByRole("button", { name: "Liste an meine Mail schicken" })).not.toBeInTheDocument();
  });

  it("zeigt weder Button noch Hinweis, wenn das Feature deaktiviert ist", async () => {
    useEmailHandlers({ emailPdfEnabled: false, workEmail: "markus@schulz.st" });
    const { findByText, queryByRole, queryByText } = renderApp({ initialPath: "/druck" });

    // wait for the sheet, then assert both the button and the hint are absent
    expect(await findByText("Gesamt")).toBeInTheDocument();
    expect(queryByRole("button", { name: "Liste an meine Mail schicken" })).not.toBeInTheDocument();
    expect(queryByText(/Hinterlege zuerst deine Arbeits-Mail/)).not.toBeInTheDocument();
  });

  it("verschickt die Liste und zeigt eine Erfolgs-Toast mit der Adresse", async () => {
    let emailHit = false;
    useEmailHandlers({ emailPdfEnabled: true, workEmail: "markus@schulz.st" });
    mswServer.use(
      http.post("*/api/order-days/day-1/email-pdf", () => {
        emailHit = true;
        return HttpResponse.json({ sentToAddress: "markus@schulz.st" });
      }),
    );
    const { findByRole, findByText } = renderApp({ initialPath: "/druck" });
    const user = userEvent.setup();

    await user.click(await findByRole("button", { name: "Liste an meine Mail schicken" }));

    await waitFor(() => {
      expect(emailHit).toBe(true);
    });
    expect(await findByText("Liste ist unterwegs an markus@schulz.st, Chef.")).toBeInTheDocument();
  });
});
