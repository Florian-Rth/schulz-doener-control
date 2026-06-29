import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authKeys } from "@/features/auth";
import { apiClient } from "@/lib/api";
import {
  DisplayNameResponseSchema,
  PayPalHandleResponseSchema,
  WorkEmailResponseSchema,
} from "./schemas";
import type { DisplayNameResponse, PayPalHandleResponse, WorkEmailResponse } from "./types";

export const profileKeys = {
  me: ["profile", "me"] as const,
};

// Sends the handle, or `null` to clear it (the backend treats null/blank as
// "switch to cash-only"). Empty strings from the clear-to-cash action map to
// null so the wire body matches the clear contract.
const updatePayPalHandle = async (handle: string): Promise<PayPalHandleResponse> => {
  const payPalHandle = handle.trim() === "" ? null : handle;
  const data = await apiClient.put("/api/profile/paypal-handle", { payPalHandle });
  return PayPalHandleResponseSchema.parse(data);
};

// Captures/updates/clears the caller's PayPal.Me handle. On success the auth
// session is invalidated so the app-wide `payPalHandleSet` gating re-reads from
// `/me`.
export const useUpdatePayPalHandle = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updatePayPalHandle,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authKeys.session });
    },
  });
};

const updateDisplayName = async (displayName: string): Promise<DisplayNameResponse> => {
  const data = await apiClient.put("/api/profile/display-name", { displayName });
  return DisplayNameResponseSchema.parse(data);
};

// Self-renames the caller's display name. On success the auth session is
// invalidated (same key `useAuth` reads) so the avatar initials/color and the
// home greeting re-read from `/me` immediately.
export const useUpdateDisplayName = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateDisplayName,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authKeys.session });
    },
  });
};

// Sends the work email, or `null` to clear it (the backend treats null/blank as
// "not provided"). Empty strings map to null so the wire body matches the clear contract.
const updateWorkEmail = async (workEmail: string): Promise<WorkEmailResponse> => {
  const value = workEmail.trim() === "" ? null : workEmail.trim();
  const data = await apiClient.put("/api/profile/work-email", { workEmail: value });
  return WorkEmailResponseSchema.parse(data);
};

// Captures/updates/clears the caller's optional work email. On success the auth
// session is invalidated so the print-view button's `workEmail` gate re-reads from `/me`.
export const useUpdateWorkEmail = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateWorkEmail,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: authKeys.session });
    },
  });
};

export interface ChangePasswordInput {
  /**
   * Omitted in forced mode — the backend detects "forced" server-side from the
   * signed must_change claim and ignores any current password. Only the
   * self-service path sends it (and the server verifies it against the hash).
   */
  currentPassword?: string;
  newPassword: string;
}

// 204 No Content on success; the apiClient throws an ApiError on a 401 (wrong
// current password) which the form hook maps to a German message. When
// `currentPassword` is undefined (forced mode) it is left out of the wire body
// entirely rather than sent as null/empty.
const changePassword = async (input: ChangePasswordInput): Promise<void> => {
  const body =
    input.currentPassword === undefined
      ? { newPassword: input.newPassword }
      : { currentPassword: input.currentPassword, newPassword: input.newPassword };
  await apiClient.post("/api/auth/change-password", body);
};

// Self-sets a new password (the only endpoint reachable while the forced-change
// gate is active). On success the backend clears the flag and revokes refresh
// tokens. The session is not invalidated here: the form hook awaits a fresh `/me`
// (via `refresh()`) before navigating so the guard reads the cleared flag — a
// mutation-level invalidation on top of that only doubles the `GET /api/auth/me`.
export const useChangePassword = () =>
  useMutation({
    mutationFn: changePassword,
  });
