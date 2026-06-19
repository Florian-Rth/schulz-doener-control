import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/features/auth";
import { ApiError } from "@/lib/api";
import { useChangePassword } from "../api";
import { changePasswordCopy } from "../copy";
import { ChangePasswordForcedFormSchema, ChangePasswordFormSchema } from "../schemas";
import type { ChangePasswordForm } from "../types";

interface UseChangePasswordFormResult {
  form: ReturnType<typeof useForm<ChangePasswordForm>>;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
  serverError: string | null;
  /**
   * True on the forced first-login change (LOCKED_SESSION sentinel). The form
   * then hides the current-password field and omits it from the payload; the
   * backend detects "forced" server-side and never needs it.
   */
  forced: boolean;
}

interface UseChangePasswordFormOptions {
  /** Where to route after a successful change. Defaults to the home dashboard. */
  redirectTo?: string;
}

// Logic layer for the change-password screen: RHF + Zod resolver (length, charset
// and match rules mirroring the backend validator) wired to the change-password
// mutation. On a 204 the backend re-issues fresh auth cookies, so the session
// stays authenticated — we never clear it or force a re-login. We await a fresh
// `/me` so the cleared `mustChangePassword` is in the cache, then route home — the
// guard then no longer forces this page. A 401 surfaces as the "wrong current
// password" message; anything else as a generic failure.
export const useChangePasswordForm = ({
  redirectTo = "/",
}: UseChangePasswordFormOptions = {}): UseChangePasswordFormResult => {
  const navigate = useNavigate();
  const { user, refresh } = useAuth();
  const changePasswordMutation = useChangePassword();
  const [serverError, setServerError] = useState<string | null>(null);

  // Forced is derived purely from the session — true for the LOCKED_SESSION
  // sentinel (forced first-login route), false for the self-service entry from
  // the profile menu. Never read from any client-controlled field.
  const forced = user?.mustChangePassword === true;

  const form = useForm<ChangePasswordForm>({
    resolver: zodResolver(forced ? ChangePasswordForcedFormSchema : ChangePasswordFormSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmNewPassword: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      await changePasswordMutation.mutateAsync({
        // Omit the current password entirely when forced — the backend ignores
        // it there and the new!=current rule does not apply.
        currentPassword: forced ? undefined : values.currentPassword,
        newPassword: values.newPassword,
      });
      // The backend re-issued fresh auth cookies on the 204, so we stay
      // authenticated. Await a fresh `/me` (it now returns mustChangePassword=
      // false) so the cleared flag is in the cache before we navigate — otherwise
      // the `_auth` guard reads the stale locked session and bounces us back to
      // this page. Then land on the app (dashboard), never /login.
      await refresh();
      await navigate({ to: redirectTo });
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setServerError(changePasswordCopy.wrongCurrent);
        return;
      }
      setServerError(changePasswordCopy.errorGeneric);
    }
  });

  return {
    form,
    onSubmit,
    isPending: changePasswordMutation.isPending,
    serverError,
    forced,
  };
};
