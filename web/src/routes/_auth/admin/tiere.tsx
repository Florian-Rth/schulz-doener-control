import { createFileRoute } from "@tanstack/react-router";
import { AdminTierePage } from "@/features/admin";

// The read-only Döner-Tiere screen at /admin/tiere. Role gating (Admin only) is
// handled by the parent `_auth/admin` layout route.
export const Route = createFileRoute("/_auth/admin/tiere")({
  component: AdminTierePage,
});
