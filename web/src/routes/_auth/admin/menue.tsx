import { createFileRoute } from "@tanstack/react-router";
import { AdminPlaceholderPage } from "@/features/admin";

// STUB child route — the real menu-administration screen ships in C3. Present
// now only so the hub link is live and the route tree is typed.
export const Route = createFileRoute("/_auth/admin/menue")({
  component: () => <AdminPlaceholderPage title="Menü" />,
});
