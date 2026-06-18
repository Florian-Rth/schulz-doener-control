import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useOpenDay } from "../api";

export interface DashboardOperations {
  toast: string | null;
  dismissToast: () => void;
  openDay: () => void;
  isOpeningDay: boolean;
  goOrder: () => void;
  goTiere: () => void;
}

interface UseDashboardOperationsArgs {
  /** Toast text from the dashboard payload (the in-foreground open-day notice). */
  serverToast: string | null;
}

// Logic layer: the action callbacks the dashboard context exposes. Holds the
// dismissible-toast UI state (seeded from the server payload) and the open-day
// mutation. Navigation targets the order + tiere screens.
export const useDashboardOperations = ({
  serverToast,
}: UseDashboardOperationsArgs): DashboardOperations => {
  const navigate = useNavigate();
  const openDayMutation = useOpenDay();
  const [dismissed, setDismissed] = useState(false);

  // Reset the dismissed flag whenever a fresh toast arrives (render-phase update,
  // tracked against the previous server value — no useEffect, no flicker).
  const [prevServerToast, setPrevServerToast] = useState(serverToast);
  if (prevServerToast !== serverToast) {
    setPrevServerToast(serverToast);
    setDismissed(false);
  }

  return {
    toast: dismissed ? null : serverToast,
    dismissToast: () => {
      setDismissed(true);
    },
    openDay: () => {
      openDayMutation.mutate();
    },
    isOpeningDay: openDayMutation.isPending,
    goOrder: () => {
      void navigate({ to: "/order" });
    },
    goTiere: () => {
      void navigate({ to: "/tiere" });
    },
  };
};
