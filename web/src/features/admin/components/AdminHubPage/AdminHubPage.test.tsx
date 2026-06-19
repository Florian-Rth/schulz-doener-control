import { waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import type { Dashboard } from "@/features/home";
import { mswServer } from "@/test/mswServer";
import { renderApp } from "@/test/renderApp";

// Minimal closed-day dashboard so the home route (the redirect target) renders
// without erroring when a non-admin is bounced there.
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

// Backend emits PascalCase role values ("Admin" | "Employee").
const sessionWithRole = (role: "Admin" | "Employee") => ({
  userId: "11111111-1111-1111-1111-111111111111",
  displayName: "Markus Wagner",
  firstName: "Markus",
  initials: "MW",
  avatarColorHex: "#00728E",
  role,
  payPalHandleSet: true,
  payPalHandle: "MarkusW",
  mustChangePassword: false,
});

const useSessionHandlers = (role: "Admin" | "Employee"): void => {
  mswServer.use(
    http.get("*/api/auth/me", () => HttpResponse.json(sessionWithRole(role))),
    http.get("*/api/dashboard", () => HttpResponse.json(closedDashboard)),
  );
};

describe("admin route guard", () => {
  it("lässt einen Admin den /admin-Bereich betreten", async () => {
    useSessionHandlers("Admin");
    const { router, findByText } = renderApp({ initialPath: "/admin" });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/admin");
    });
    expect(await findByText("Steuerstand für den Döner-Tag")).toBeInTheDocument();
  });

  it("leitet einen Employee von /admin nach / um", async () => {
    useSessionHandlers("Employee");
    const { router } = renderApp({ initialPath: "/admin" });

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/");
    });
  });
});
