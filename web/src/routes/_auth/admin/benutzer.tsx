import { createFileRoute } from "@tanstack/react-router";
import { AdminPlaceholderPage } from "@/features/admin";

// STUB child route — the real user-administration screen ships in C2. Present
// now only so the hub link is live and the route tree is typed.
export const Route = createFileRoute("/_auth/admin/benutzer")({
  component: () => <AdminPlaceholderPage title="Benutzer" />,
});
