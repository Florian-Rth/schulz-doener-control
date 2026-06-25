import { createFileRoute } from "@tanstack/react-router";
import { AdminPizzaVariantsPage } from "@/features/admin";

// The pizza-variant administration screen at /admin/pizza-variants. Role gating (Admin only) is
// handled by the parent `_auth/admin` layout route.
export const Route = createFileRoute("/_auth/admin/pizza-variants")({
  component: AdminPizzaVariantsPage,
});
