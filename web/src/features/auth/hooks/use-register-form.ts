import { zodResolver } from "@hookform/resolvers/zod";
import { getRouteApi } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ApiError } from "@/lib/api";
import { useRegister } from "../api";
import { authCopy } from "../copy";
import { AuthRegistrationMode, RegisterFormSchema } from "../schemas";
import type { RegisterForm } from "../types";

interface UseRegisterFormOptions {
  /**
   * The self-registration mode from the client config (1 Enabled / 2 Disabled /
   * 3 SecretKeyOnly), fed in by the route. Defaults to Enabled so the form
   * behaves normally when the config has not resolved.
   */
  registrationMode?: number;
}

interface UseRegisterFormResult {
  form: ReturnType<typeof useForm<RegisterForm>>;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
  serverError: string | null;
  registered: boolean;
  /**
   * True when registration requires a secret key but none was supplied in the
   * URL — the page shows a hint instead of the form so the user does not submit
   * a request the backend will reject.
   */
  secretKeyMissing: boolean;
}

// Logic layer for the registration screen: RHF + Zod resolver wired to the
// register mutation. On success it flips `registered` so the page swaps to the
// success panel (no session is issued — the user logs in afterward). The error
// message is chosen by HTTP status: 409 = duplicate username, 403 = wrong/missing
// secret key (the FastEndpoints envelope has no `detail` to read), everything
// else falls back to a generic failure line.
export const useRegisterForm = ({
  registrationMode = AuthRegistrationMode.Enabled,
}: UseRegisterFormOptions = {}): UseRegisterFormResult => {
  // The registration route carries an optional `secretKey` in its search params
  // (embedded in the QR-code URL), with `code` kept as a legacy alias. Reading it
  // here keeps the route component thin and avoids prop-drilling a value the user
  // never sees.
  const { secretKey, code } = getRouteApi("/register").useSearch();
  const registrationSecret = secretKey ?? code;
  const secretKeyMissing =
    registrationMode === AuthRegistrationMode.SecretKeyOnly &&
    (registrationSecret === undefined || registrationSecret.trim() === "");
  const registerMutation = useRegister();
  const [serverError, setServerError] = useState<string | null>(null);
  const [registered, setRegistered] = useState(false);

  const form = useForm<RegisterForm>({
    resolver: zodResolver(RegisterFormSchema),
    defaultValues: {
      username: "",
      displayName: "",
      payPalHandle: "",
      workEmail: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      await registerMutation.mutateAsync({ form: values, secretKey: registrationSecret });
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

  return {
    form,
    onSubmit,
    isPending: registerMutation.isPending,
    serverError,
    registered,
    secretKeyMissing,
  };
};
