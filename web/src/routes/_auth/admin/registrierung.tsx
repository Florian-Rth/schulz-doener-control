import { createFileRoute } from "@tanstack/react-router";
import { AdminRegistrationModePage } from "@/features/admin";

// The registration-mode administration screen at /admin/registrierung. Role gating (Admin only) is
// handled by the parent `_auth/admin` layout route.
export const Route = createFileRoute("/_auth/admin/registrierung")({
  component: AdminRegistrationModePage,
});
