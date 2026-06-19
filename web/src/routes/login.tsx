import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { ensureAuthStatus, LoginPage } from "@/features/auth";

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
});

const LoginRoute = () => {
  const { redirect: redirectTo } = Route.useSearch();
  return <LoginPage redirect={redirectTo} />;
};

export const Route = createFileRoute("/login")({
  validateSearch: loginSearchSchema,
  beforeLoad: async ({ context }) => {
    if ((await ensureAuthStatus(context.queryClient)) === "authenticated") {
      throw redirect({ to: "/" });
    }
  },
  component: LoginRoute,
});
