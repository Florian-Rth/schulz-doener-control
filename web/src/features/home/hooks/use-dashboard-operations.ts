import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  useClaimCollector,
  useCloseDay,
  useCloseOrdering,
  useForceEndDay,
  useOpenDay,
  useSettleDebt,
} from "../api";

export interface DashboardOperations {
  toast: string | null;
  dismissToast: () => void;
  openDay: () => void;
  isOpeningDay: boolean;
  closeOrdering: (dayId: string) => void;
  isClosingOrdering: boolean;
  closeDay: (dayId: string) => void;
  isClosingDay: boolean;
  /** Admin-only: scrap-and-end the running day — discards all orders, no debts. */
  forceEndDay: (dayId: string) => void;
  isForceEndingDay: boolean;
  /** Become the designated Abholer for the running day ("Ich hole heute ab" / take-over). */
  claimCollector: (dayId: string) => void;
  isClaimingCollector: boolean;
  /** Personal "ich hab bezahlt" confirmation for an open debt (one-way settle). */
  settle: (debtId: string) => void;
  /** True only for the debt row whose settle is currently in flight. */
  isSettling: (debtId: string) => boolean;
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
  const forceEndDayMutation = useForceEndDay({ onError: showError });
  const claimCollectorMutation = useClaimCollector({ onError: showError });
  const settleMutation = useSettleDebt();
  // The debt row whose settle is in flight, so only that row disables its
  // control. null = none pending.
  const [settlingDebtId, setSettlingDebtId] = useState<string | null>(null);

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
    forceEndDay: (dayId: string) => {
      setErrorToast(null);
      forceEndDayMutation.mutate(dayId);
    },
    isForceEndingDay: forceEndDayMutation.isPending,
    claimCollector: (dayId: string) => {
      setErrorToast(null);
      claimCollectorMutation.mutate(dayId);
    },
    isClaimingCollector: claimCollectorMutation.isPending,
    settle: (debtId: string) => {
      setSettlingDebtId(debtId);
      settleMutation.mutate(debtId, {
        onSettled: () => {
          setSettlingDebtId(null);
        },
      });
    },
    isSettling: (debtId: string) => settlingDebtId === debtId,
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
