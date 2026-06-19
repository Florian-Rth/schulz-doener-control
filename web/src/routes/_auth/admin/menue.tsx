import { createFileRoute } from "@tanstack/react-router";
import { AdminMenuPage } from "@/features/admin";

// The menu-administration screen at /admin/menue. Role gating (Admin only) is
// handled by the parent `_auth/admin` layout route.
export const Route = createFileRoute("/_auth/admin/menue")({
  component: AdminMenuPage,
});
