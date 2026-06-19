import { createFileRoute } from "@tanstack/react-router";
import { AdminHubPage } from "@/features/admin";

// The admin hub landing at /admin. Role gating is handled by the parent
// `_auth/admin` layout route.
export const Route = createFileRoute("/_auth/admin/")({
  component: AdminHubPage,
});
