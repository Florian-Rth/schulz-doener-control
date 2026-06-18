import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { TierCatalogSchema } from "./schemas";
import type { TierCatalog } from "./types";

export const tiereKeys = {
  catalog: ["tiere", "catalog"] as const,
};

const fetchTierCatalog = async (signal: AbortSignal): Promise<TierCatalog> => {
  const data = await apiClient.get("/api/tiere", signal);
  return TierCatalogSchema.parse(data);
};

// All 15 Tiere + the caller's `isMine` flag, single round-trip. Priority order
// is preserved by the server.
export const useTierCatalog = () =>
  useQuery({
    queryKey: tiereKeys.catalog,
    queryFn: ({ signal }) => fetchTierCatalog(signal),
  });
