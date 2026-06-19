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

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

// 204 No Content on success; the apiClient throws an ApiError on a 401 (wrong
// current password) which the form hook maps to a German message.
const changePassword = async (input: ChangePasswordInput): Promise<void> => {
  await apiClient.post("/api/auth/change-password", {
    currentPassword: input.currentPassword,
    newPassword: input.newPassword,
  });
};

// Self-sets a new password (the only endpoint reachable while the forced-change
// gate is active). On success the backend clears the flag and revokes refresh
// tokens; we invalidate the auth session so the SPA re-reads `/me` and the guard
// stops forcing the password-change page.
export const useChangePassword = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authKeys.session });
    },
  });
};
