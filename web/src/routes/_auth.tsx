import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { ensureSessionGate } from "@/features/auth";

const CHANGE_PASSWORD_PATH = "/passwort-aendern";

// Pathless layout route = the auth guard. `beforeLoad` ensures the session is
// resolved (from cache or a `GET /api/auth/me` fetch) via the router's
// queryClient, then:
//   - anonymous visitors are sent to /login with a `redirect` back-link;
//   - authenticated-but-locked accounts (forced password change) are sent to
//     /passwort-aendern, unless they are already there — keeping that page
//     reachable so there is no redirect loop.
// Reading from the cache — not React context — means a fresh login that just
// refetched the session is reflected immediately, with no render lag.
export const Route = createFileRoute("/_auth")({
  beforeLoad: async ({ context, location }) => {
    const { status, mustChangePassword } = await ensureSessionGate(context.queryClient);

    if (status === "anonymous") {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }

    if (
      status === "authenticated" &&
      mustChangePassword &&
      location.pathname !== CHANGE_PASSWORD_PATH
    ) {
      throw redirect({ to: CHANGE_PASSWORD_PATH });
    }
  },
  component: Outlet,
});
