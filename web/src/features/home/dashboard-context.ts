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
  /** Navigates to the order screen. */
  goOrder: () => void;
  /** Navigates to the Döner-Tiere catalog. */
  goTiere: () => void;
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
