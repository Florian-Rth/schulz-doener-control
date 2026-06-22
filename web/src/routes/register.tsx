import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { ensureAuthStatus, RegisterPage } from "@/features/auth";

// Optional invite code embedded in the QR-code URL (`/register?code=XYZ`). It is
// invisible to the user; the register form hook reads it and submits it as
// `inviteCode`. Absent when registration is open server-side.
const registerSearchSchema = z.object({
  code: z.string().optional(),
});

export const Route = createFileRoute("/register")({
  validateSearch: registerSearchSchema,
  beforeLoad: async ({ context }) => {
    if ((await ensureAuthStatus(context.queryClient)) === "authenticated") {
      throw redirect({ to: "/" });
    }
  },
  component: RegisterPage,
});
