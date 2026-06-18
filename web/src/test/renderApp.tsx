import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AnyRouter } from "@tanstack/react-router";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { render } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/features/auth";
import { routeTree } from "@/routeTree.gen";
import { theme } from "@/styles/theme";

// Builds an isolated router + query client per test so cache/auth state never
// leaks between cases. Mirrors the real wiring in main.tsx: an inner component
// reads useAuth() and feeds it into the router context the guard reads.
const buildTestQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });

interface RenderAppOptions {
  initialPath?: string;
}

const InnerApp = ({ router }: { router: AnyRouter }) => {
  const auth = useAuth();
  return <RouterProvider router={router} context={{ auth }} />;
};

export const renderApp = ({ initialPath = "/" }: RenderAppOptions = {}) => {
  const queryClient = buildTestQueryClient();
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
    context: { auth: undefined, queryClient },
    defaultPreload: false,
  });

  const result = render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <InnerApp router={router} />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>,
  );

  return { ...result, router };
};
