import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, apiClient } from "@/lib/api";
import { homeCopy } from "./copy";
import { DashboardSchema, PaymentHistorySchema, ReceivablesSchema } from "./schemas";
import type { Dashboard, PaymentHistory, Receivables } from "./types";

export const dashboardKeys = {
  all: ["dashboard"] as const,
};

export const paymentHistoryKeys = {
  all: ["payment-history"] as const,
};

export const receivablesKeys = {
  all: ["receivables"] as const,
};

const fetchDashboard = async (signal: AbortSignal): Promise<Dashboard> => {
  const data = await apiClient.get("/api/dashboard", signal);
  return DashboardSchema.parse(data);
};

export const useDashboard = () =>
  useQuery({
    queryKey: dashboardKeys.all,
    queryFn: ({ signal }) => fetchDashboard(signal),
    // Keep the running day fresh while the tab is focused; pause polling in the
    // background so we do not hammer the API on a hidden tab.
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });

const paymentHistoryPageSize = 10;

// GET /api/debts/history?skip=&take= — one page of the caller's own settled
// payments (newest first). A standalone read-only query, deliberately NOT
// folded into the dashboard aggregate, so the history card can fetch
// independently and grow page by page instead of loading everything.
const fetchPaymentHistory = async (skip: number, signal: AbortSignal): Promise<PaymentHistory> => {
  const data = await apiClient.get(
    `/api/debts/history?skip=${skip}&take=${paymentHistoryPageSize}`,
    signal,
  );
  return PaymentHistorySchema.parse(data);
};

export const useMyPaymentHistory = () =>
  useInfiniteQuery({
    queryKey: paymentHistoryKeys.all,
    queryFn: ({ pageParam, signal }) => fetchPaymentHistory(pageParam, signal),
    initialPageParam: 0,
    getNextPageParam: (lastPage: PaymentHistory, allPages: PaymentHistory[]): number | undefined =>
      lastPage.hasMore ? allPages.length * paymentHistoryPageSize : undefined,
  });

// GET /api/debts/receivables — what the collector is still owed (open debts
// others have toward them) plus the already-settled ones. A standalone
// read-only query (NOT folded into the dashboard aggregate), one-shot like the
// payment history — no 5s polling.
const fetchReceivables = async (signal: AbortSignal): Promise<Receivables> => {
  const data = await apiClient.get("/api/debts/receivables", signal);
  return ReceivablesSchema.parse(data);
};

export const useReceivables = () =>
  useQuery({
    queryKey: receivablesKeys.all,
    queryFn: ({ signal }) => fetchReceivables(signal),
  });

// POST /api/order-days/open — "Ich will heute Döner!". The server resolves
// today + cutoff and broadcasts the push; we only need to invalidate the
// dashboard so the running-day section + toast appear on refetch.
const openDay = async (): Promise<void> => {
  await apiClient.post("/api/order-days/open");
};

export const useOpenDay = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: openDay,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
};

interface CloseMutationOptions {
  /** Surface a German error toast on 403 (not the collector) / 409 (already closed). */
  onError: (message: string) => void;
}

// POST /api/order-days/{id}/close-ordering — collector-only ordering lock. The
// server flips isOrderingClosed; we invalidate so the card swaps to the
// "Döner-Tag schließen" button on refetch.
const closeOrdering = async (dayId: string): Promise<void> => {
  await apiClient.post(`/api/order-days/${dayId}/close-ordering`);
};

export const useCloseOrdering = ({ onError }: CloseMutationOptions) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: closeOrdering,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
    onError: () => {
      onError(homeCopy.closeOrderingFailed);
    },
  });
};

// POST /api/order-days/{id}/close — collector-only day close; the server creates
// the debts. We invalidate so the section swaps to the closed state on refetch.
const closeDay = async (dayId: string): Promise<void> => {
  await apiClient.post(`/api/order-days/${dayId}/close`);
};

export const useCloseDay = ({ onError }: CloseMutationOptions) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: closeDay,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
    onError: () => {
      onError(homeCopy.closeDayFailed);
    },
  });
};

// POST /api/order-days/{id}/force-end — admin scrap-and-end: discards all orders and closes the day
// WITHOUT debts (unlike /close). Admin-only on the server. We invalidate so the section swaps to the
// closed state on refetch.
const forceEndDay = async (dayId: string): Promise<void> => {
  await apiClient.post(`/api/order-days/${dayId}/force-end`);
};

export const useForceEndDay = ({ onError }: CloseMutationOptions) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: forceEndDay,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
    onError: () => {
      onError(homeCopy.adminEndFailed);
    },
  });
};

// POST /api/debts/{id}/settle — the caller's personal "ich hab bezahlt"
// confirmation (FEATURE 4). One-way: the server marks the debt Settled and it
// drops off the open-debts list, so we invalidate the dashboard to let it
// disappear on refetch. A 409 means it was already settled (our view is stale)
// — we still refresh quietly and swallow the error; no toast either way.
const settleDebt = async (debtId: string): Promise<void> => {
  await apiClient.post(`/api/debts/${debtId}/settle`);
};

export const useSettleDebt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: settleDebt,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      void queryClient.invalidateQueries({ queryKey: paymentHistoryKeys.all });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      }
    },
  });
};

// POST /api/order-days/{dayId}/collector/claim — "Ich hole heute ab" / take-over
// (FEATURE 2/3). The caller becomes the designated Abholer (they must already
// have an order). Contract: 200 success · 400 caller has no order · 409 day
// closed. On success we invalidate so the abholer block + collector controls
// swap on refetch.
const claimCollector = async (dayId: string): Promise<void> => {
  await apiClient.post(`/api/order-days/${dayId}/collector/claim`);
};

export const useClaimCollector = ({ onError }: CloseMutationOptions) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: claimCollector,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 400) {
        onError(homeCopy.claimNeedsOrder);
      } else if (error instanceof ApiError && error.status === 409) {
        onError(homeCopy.claimOrderingClosed);
      } else {
        onError(homeCopy.claimFailed);
      }
    },
  });
};

// POST /api/order-days/{dayId}/pickup-wheel/excuse — the Glücksrad's chosen one has a VERY
// important reason: they drop off the wheel and the server spins again among the rest. Contract:
// 200 re-spun · 403 caller is not the chosen one · 409 nobody left / day locked. On success we
// invalidate so the new spin arrives and every device shows its "Rad drehen" button again.
const excusePickupWheel = async (dayId: string): Promise<void> => {
  await apiClient.post(`/api/order-days/${dayId}/pickup-wheel/excuse`);
};

export const useExcusePickupWheel = ({ onError }: CloseMutationOptions) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: excusePickupWheel,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
    onError: (error) => {
      void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      if (error instanceof ApiError && error.status === 409) {
        onError(homeCopy.wheelNobodyLeft);
      } else {
        onError(homeCopy.wheelExcuseFailed);
      }
    },
  });
};
