import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLogin } from "../api";
import { useAuth } from "../auth-context";
import { authCopy } from "../copy";
import { LoginFormSchema } from "../schemas";
import type { LoginForm } from "../types";

interface UseLoginFormResult {
  form: ReturnType<typeof useForm<LoginForm>>;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
  serverError: string | null;
}

interface UseLoginFormOptions {
  /** Where to return the user after a successful login (deep-link support). */
  redirect?: string;
}

// Logic layer for the login screen: RHF + Zod resolver wired to the login
// mutation. On success it refreshes the session then routes to the forced
// password change, the deep-link redirect, or the home dashboard.
export const useLoginForm = ({ redirect }: UseLoginFormOptions = {}): UseLoginFormResult => {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const loginMutation = useLogin();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<LoginForm>({
    resolver: zodResolver(LoginFormSchema),
    defaultValues: { username: "", password: "" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      const result = await loginMutation.mutateAsync(values);
      await refresh();
      if (result.mustChangePassword) {
        await navigate({ to: "/passwort-aendern" });
        return;
      }
      await navigate({ to: redirect ?? "/" });
    } catch {
      setServerError(authCopy.loginFailed);
    }
  });

  return { form, onSubmit, isPending: loginMutation.isPending, serverError };
};
