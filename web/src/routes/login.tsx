import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { ensureSession, LoginPage, resolveAuthStatus } from "@/features/auth";

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
    await ensureSession(context.queryClient);
    if (resolveAuthStatus(context.queryClient) === "authenticated") {
      throw redirect({ to: "/" });
    }
  },
  component: LoginRoute,
});
