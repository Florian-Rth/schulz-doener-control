import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
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
