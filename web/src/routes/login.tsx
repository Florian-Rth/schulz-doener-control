import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { ensureAuthStatus, LoginPage } from "@/features/auth";
import { useRegistrationMode } from "@/features/pwa-gate";

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
});

// The route owns the cross-feature config read (routes compose features): it resolves the
// registration mode from the client config and passes it into the auth feature's login page, which
// hides the register link when registration is switched off.
const LoginRoute = () => {
  const { redirect: redirectTo } = Route.useSearch();
  const registrationMode = useRegistrationMode();
  return <LoginPage redirect={redirectTo} registrationMode={registrationMode} />;
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
