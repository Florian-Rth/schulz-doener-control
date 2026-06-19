import { createFileRoute } from "@tanstack/react-router";
import { AdminPlaceholderPage } from "@/features/admin";

// STUB child route — the real Döner-Tiere admin screen ships in C4. Present now
// only so the hub link is live and the route tree is typed.
export const Route = createFileRoute("/_auth/admin/tiere")({
  component: () => <AdminPlaceholderPage title="Döner-Tiere" />,
});
