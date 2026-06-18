import { createRootRoute, Outlet } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

// Devtools are dev-only and code-split so they never ship to production.
const TanStackRouterDevtools = import.meta.env.PROD
  ? () => null
  : lazy(() =>
      import("@tanstack/react-router-devtools").then((mod) => ({
        default: mod.TanStackRouterDevtools,
      })),
    );

const RootLayout = () => {
  return (
    <>
      <Outlet />
      <Suspense fallback={null}>
        <TanStackRouterDevtools />
      </Suspense>
    </>
  );
};

export const Route = createRootRoute({
  component: RootLayout,
});
