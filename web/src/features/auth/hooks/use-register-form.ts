import { zodResolver } from "@hookform/resolvers/zod";
import { getRouteApi } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ApiError } from "@/lib/api";
import { useRegister } from "../api";
import { authCopy } from "../copy";
import { RegisterFormSchema } from "../schemas";
import type { RegisterForm } from "../types";

interface UseRegisterFormResult {
  form: ReturnType<typeof useForm<RegisterForm>>;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
  serverError: string | null;
  registered: boolean;
}

// Logic layer for the registration screen: RHF + Zod resolver wired to the
// register mutation. On success it flips `registered` so the page swaps to the
// success panel (no session is issued — the user logs in afterward). The error
// message is chosen by HTTP status: 409 = duplicate username, 403 = wrong/missing
// invite code (the FastEndpoints envelope has no `detail` to read), everything
// else falls back to a generic failure line.
export const useRegisterForm = (): UseRegisterFormResult => {
  // The registration route carries an optional invite `code` in its search
  // params (embedded in the QR-code URL). Reading it here keeps the route
  // component thin and avoids prop-drilling a value the user never sees.
  const { code } = getRouteApi("/register").useSearch();
  const registerMutation = useRegister();
  const [serverError, setServerError] = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);

  const form = useForm<RegisterForm>({
    resolver: zodResolver(RegisterFormSchema),
    defaultValues: {
      username: "",
      displayName: "",
      payPalHandle: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      await registerMutation.mutateAsync({ form: values, inviteCode: code });
      setRegistered(true);
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setServerError(authCopy.registerDuplicate);
        return;
      }
      if (error instanceof ApiError && error.status === 403) {
        setServerError(authCopy.registerCodeInvalid);
        return;
      }
      setServerError(authCopy.registerFailed);
    }
  });

  return { form, onSubmit, isPending: registerMutation.isPending, serverError, registered };
};
