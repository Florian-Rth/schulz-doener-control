import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { homeCopy } from "./copy";
import { DashboardSchema } from "./schemas";
import type { Dashboard } from "./types";

export const dashboardKeys = {
  all: ["dashboard"] as const,
};

const fetchDashboard = async (signal: AbortSignal): Promise<Dashboard> => {
  const data = await apiClient.get("/api/dashboard", signal);
  return DashboardSchema.parse(data);
};

export const useDashboard = () =>
  useQuery({
    queryKey: dashboardKeys.all,
    queryFn: ({ signal }) => fetchDashboard(signal),
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
