import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ensureAuthStatus, ensureRole } from "@/features/auth";

// The `/admin` route group, nested under the `_auth` guard so its
// authentication + must-change gating runs first (it is this route's parent).
// This `beforeLoad` then re-confirms the session and gates on the Admin role:
// `ensureRole` throws a redirect to "/" for any non-Admin (Employee or an
// unexpectedly anonymous caller). All children (/admin, /admin/benutzer,
// /admin/menue, /admin/tiere) inherit this guard.
export const Route = createFileRoute("/_auth/admin")({
  beforeLoad: async ({ context }) => {
    await ensureAuthStatus(context.queryClient);
    await ensureRole(context.queryClient, "Admin");
  },
  component: Outlet,
});
