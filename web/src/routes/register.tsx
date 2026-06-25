import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { ensureAuthStatus, RegisterPage } from "@/features/auth";
import { useRegistrationMode } from "@/features/pwa-gate";

// Registration secret key embedded in the QR-code URL (`/register?secretKey=XYZ`,
// with `?code=XYZ` kept as a legacy alias). It is invisible to the user; the
// register form hook reads it and submits it as `secretKey`. Absent when
// registration is open server-side.
const registerSearchSchema = z.object({
  secretKey: z.string().optional(),
  code: z.string().optional(),
});

// The route owns the cross-feature config read (routes compose features): it
// resolves the registration mode from the client config and passes it into the
// auth feature's page, so the auth feature never imports pwa-gate directly.
const RegisterRoute = () => {
  const registrationMode = useRegistrationMode();
  return <RegisterPage registrationMode={registrationMode} />;
};

export const Route = createFileRoute("/register")({
  validateSearch: registerSearchSchema,
  beforeLoad: async ({ context }) => {
    if ((await ensureAuthStatus(context.queryClient)) === "authenticated") {
      throw redirect({ to: "/" });
    }
  },
  component: RegisterRoute,
});
