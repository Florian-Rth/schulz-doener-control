import { createFileRoute } from "@tanstack/react-router";
import { AdminNotificationTemplatesPage } from "@/features/admin";

// The notification-text administration screen at /admin/benachrichtigungen. Role gating (Admin
// only) is handled by the parent `_auth/admin` layout route.
export const Route = createFileRoute("/_auth/admin/benachrichtigungen")({
  component: AdminNotificationTemplatesPage,
});
