import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { ClientConfigSchema, RegistrationMode } from "./schemas";
import type { ClientConfig, RegistrationModeValue } from "./types";

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

// The self-registration policy lifted from the client config. The login/register screens read this
// to hide the register link (Disabled) or require the secret key (SecretKeyOnly). It fails open to
// Enabled while the config is loading or unavailable (e.g. an anonymous 401), so the register flow
// is never accidentally locked out by a config hiccup.
export const useRegistrationMode = (): RegistrationModeValue => {
  const config = useClientConfig();
  return config.data?.registrationMode ?? RegistrationMode.Enabled;
};
