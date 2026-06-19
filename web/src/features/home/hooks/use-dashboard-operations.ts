import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useCloseDay, useCloseOrdering, useOpenDay } from "../api";

export interface DashboardOperations {
  toast: string | null;
  dismissToast: () => void;
  openDay: () => void;
  isOpeningDay: boolean;
  closeOrdering: (dayId: string) => void;
  isClosingOrdering: boolean;
  closeDay: (dayId: string) => void;
  isClosingDay: boolean;
  goOrder: () => void;
  goTiere: () => void;
  goPrint: () => void;
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
  // Client-side error toast from a failed close mutation (403/409). Takes
  // precedence over the server toast and un-dismisses the toast slot.
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const showError = (message: string): void => {
    setErrorToast(message);
    setDismissed(false);
  };
  const closeOrderingMutation = useCloseOrdering({ onError: showError });
  const closeDayMutation = useCloseDay({ onError: showError });

  // Reset the dismissed flag whenever a fresh toast arrives (render-phase update,
  // tracked against the previous server value — no useEffect, no flicker).
  const [prevServerToast, setPrevServerToast] = useState(serverToast);
  if (prevServerToast !== serverToast) {
    setPrevServerToast(serverToast);
    setDismissed(false);
  }

  return {
    toast: dismissed ? null : (errorToast ?? serverToast),
    dismissToast: () => {
      setDismissed(true);
      setErrorToast(null);
    },
    openDay: () => {
      openDayMutation.mutate();
    },
    isOpeningDay: openDayMutation.isPending,
    closeOrdering: (dayId: string) => {
      setErrorToast(null);
      closeOrderingMutation.mutate(dayId);
    },
    isClosingOrdering: closeOrderingMutation.isPending,
    closeDay: (dayId: string) => {
      setErrorToast(null);
      closeDayMutation.mutate(dayId);
    },
    isClosingDay: closeDayMutation.isPending,
    goOrder: () => {
      void navigate({ to: "/order" });
    },
    goTiere: () => {
      void navigate({ to: "/tiere" });
    },
    goPrint: () => {
      void navigate({ to: "/druck" });
    },
  };
};
