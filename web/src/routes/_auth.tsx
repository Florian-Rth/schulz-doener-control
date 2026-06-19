import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { ensureAuthStatus } from "@/features/auth";

// Pathless layout route = the auth guard. `beforeLoad` ensures the session is
// resolved (from cache or a `GET /api/auth/me` fetch) via the router's
// queryClient, then redirects anonymous visitors to /login with a `redirect`
// back-link. Reading from the cache — not React context — means a fresh login
// that just refetched the session is reflected immediately, with no render lag.
export const Route = createFileRoute("/_auth")({
  beforeLoad: async ({ context, location }) => {
    if ((await ensureAuthStatus(context.queryClient)) === "anonymous") {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  component: Outlet,
});
