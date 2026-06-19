import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/features/auth";
import { ApiError } from "@/lib/api";
import { useChangePassword } from "../api";
import { changePasswordCopy } from "../copy";
import { ChangePasswordFormSchema } from "../schemas";
import type { ChangePasswordForm } from "../types";

interface UseChangePasswordFormResult {
  form: ReturnType<typeof useForm<ChangePasswordForm>>;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
  serverError: string | null;
}

interface UseChangePasswordFormOptions {
  /** Where to route after a successful change. Defaults to the home dashboard. */
  redirectTo?: string;
}

// Logic layer for the change-password screen: RHF + Zod resolver (length, charset
// and match rules mirroring the backend validator) wired to the change-password
// mutation. On success we await a fresh `/me` so the cleared `mustChangePassword`
// is in the cache, then route home — the guard then no longer forces this page.
// A 401 surfaces as the "wrong current password" message; anything else as a
// generic failure.
export const useChangePasswordForm = ({
  redirectTo = "/",
}: UseChangePasswordFormOptions = {}): UseChangePasswordFormResult => {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const changePasswordMutation = useChangePassword();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<ChangePasswordForm>({
    resolver: zodResolver(ChangePasswordFormSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmNewPassword: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      await changePasswordMutation.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      // Await a fresh `/me` so the cleared `mustChangePassword` is in the cache
      // before we navigate — otherwise the `_auth` guard reads the stale locked
      // session and bounces us straight back to this page.
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
  };
};
