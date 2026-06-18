import { createRouter } from "@tanstack/react-router";
import { queryClient } from "@/lib/query-client";
import type { RouterContext } from "@/lib/router-context";
import { routeTree } from "@/routeTree.gen";

// `auth` is filled in by <InnerApp> via the RouterProvider `context` prop; it is
// undefined here only between router creation and the first render.
const context: RouterContext = {
  auth: undefined,
  queryClient,
};

export const router = createRouter({
  routeTree,
  context,
  defaultPreload: "intent",
  scrollRestoration: true,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
