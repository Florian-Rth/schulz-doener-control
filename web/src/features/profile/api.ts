import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authKeys } from "@/features/auth";
import { apiClient } from "@/lib/api";
import { PayPalHandleResponseSchema } from "./schemas";
import type { PayPalHandleResponse } from "./types";

export const profileKeys = {
  me: ["profile", "me"] as const,
};

const updatePayPalHandle = async (handle: string): Promise<PayPalHandleResponse> => {
  const data = await apiClient.put("/api/profile/paypal-handle", { payPalHandle: handle });
  return PayPalHandleResponseSchema.parse(data);
};

// Captures/updates the caller's PayPal.Me handle. On success the auth session is
// invalidated so the app-wide `payPalHandleSet` gating re-reads from `/me`.
export const useUpdatePayPalHandle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatePayPalHandle,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authKeys.session });
    },
  });
};
