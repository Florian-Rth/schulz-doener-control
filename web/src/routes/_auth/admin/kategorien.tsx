import { createFileRoute } from "@tanstack/react-router";
import { AdminCategoriesPage } from "@/features/admin";

// The category administration screen at /admin/kategorien. Role gating (Admin only) is handled by
// the parent `_auth/admin` layout route.
export const Route = createFileRoute("/_auth/admin/kategorien")({
  component: AdminCategoriesPage,
});
