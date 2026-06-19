import { createContext, useContext } from "react";
import type {
  DashboardDay,
  DashboardDebts,
  DashboardLeaderboard,
  DashboardStats,
  DashboardTier,
} from "./types";

export interface DashboardContextValue {
  firstName: string;
  displayName: string;
  avatarColorHex: string;
  stats: DashboardStats;
  tier: DashboardTier;
  leaderboard: DashboardLeaderboard;
  day: DashboardDay;
  debts: DashboardDebts;
  /** In-foreground open-day toast text; null = no toast to show. */
  toast: string | null;
  dismissToast: () => void;
  /** Opens today's Döner-Tag (the closed-state CTA). */
  openDay: () => void;
  isOpeningDay: boolean;
  /** Collector-only: locks ordering for the running day. */
  closeOrdering: (dayId: string) => void;
  isClosingOrdering: boolean;
  /** Collector-only: closes the day and creates the debts. */
  closeDay: (dayId: string) => void;
  isClosingDay: boolean;
  /** Personal "ich hab bezahlt" confirmation for an open debt (one-way). */
  settle: (debtId: string) => void;
  /** True only for the debt row whose settle is currently in flight. */
  isSettling: (debtId: string) => boolean;
  /** Navigates to the order screen. */
  goOrder: () => void;
  /** Navigates to the Döner-Tiere catalog. */
  goTiere: () => void;
  /** Navigates to the printable Abholer order list. */
  goPrint: () => void;
}

// One context for the dashboard compound group. Children read it instead of
// threading 6+ props. Throws outside the provider to make missing-wrapper bugs
// loud.
export const DashboardContext = createContext<DashboardContextValue | null>(null);

export const useDashboardContext = (): DashboardContextValue => {
  const value = useContext(DashboardContext);
  if (value === null) {
    throw new Error("useDashboardContext muss innerhalb von <DashboardProvider> verwendet werden.");
  }
  return value;
};
