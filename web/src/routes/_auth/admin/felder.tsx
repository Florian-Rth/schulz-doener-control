import { createFileRoute } from "@tanstack/react-router";
import { AdminFieldsPage } from "@/features/admin";

// The fields administration screen at /admin/felder. Role gating (Admin only) is handled by the
// parent `_auth/admin` layout route.
export const Route = createFileRoute("/_auth/admin/felder")({
  component: AdminFieldsPage,
});
