import type { QueryClient } from "@tanstack/react-query";
import type { AuthContextValue } from "@/features/auth";

// The context every route receives. `auth` is fed in from <InnerApp> (which reads
// useAuth) so the route guard can read the live session status in `beforeLoad`.
// It is optional at router-creation time and guaranteed present once <InnerApp>
// supplies it via the RouterProvider `context` prop.
export interface RouterContext {
  auth: AuthContextValue | undefined;
  queryClient: QueryClient;
}
