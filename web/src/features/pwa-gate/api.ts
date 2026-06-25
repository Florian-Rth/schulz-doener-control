import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { ClientConfigSchema } from "./schemas";
import type { ClientConfig } from "./types";

export const configKeys = {
  client: ["config", "client"] as const,
};

const fetchClientConfig = async (signal: AbortSignal): Promise<ClientConfig> => {
  const data = await apiClient.get("/api/config", signal);
  return ClientConfigSchema.parse(data);
};

// Loads the non-secret client config (the PWA-gate kill-switch). Lives long — the flag only changes
// on a server config change — so the staleTime is generous, fetched once per session.
export const useClientConfig = () => {
  return useQuery({
    queryKey: configKeys.client,
    queryFn: ({ signal }) => fetchClientConfig(signal),
    staleTime: Number.POSITIVE_INFINITY,
  });
};
