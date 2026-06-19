import { createFileRoute } from "@tanstack/react-router";
import { AdminUsersPage } from "@/features/admin";

// The user-administration screen at /admin/benutzer. Role gating (Admin only) is
// handled by the parent `_auth/admin` layout route.
export const Route = createFileRoute("/_auth/admin/benutzer")({
  component: AdminUsersPage,
});
