import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import "@fontsource/open-sans/400.css";
import "@fontsource/open-sans/600.css";
import "@fontsource/open-sans/700.css";
import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider, useAuth } from "@/features/auth";
import { registerHardLogout } from "@/lib/api";
import { registerServiceWorker } from "@/lib/push";
import { queryClient } from "@/lib/query-client";
import { router } from "@/lib/router";
import { AppGlobalStyles } from "@/styles/AppGlobalStyles";
import { theme } from "@/styles/theme";

// Reads the live auth context and feeds it into the router context so the guard
// can decide in `beforeLoad`. Also registers the hard-logout navigation that the
// apiClient invokes when a 401 cannot be recovered by a refresh.
const InnerApp = () => {
  const auth = useAuth();

  useEffect(() => {
    registerHardLogout(() => {
      auth.clear();
      void router.navigate({ to: "/login", search: { redirect: router.state.location.href } });
    });
  }, [auth]);

  return <RouterProvider router={router} context={{ auth }} />;
};

const rootElement = document.getElementById("root");

if (rootElement === null) {
  throw new Error("Root-Element wurde nicht gefunden.");
}

// Register the Web Push service worker up front (no-op when unsupported) so the
// push handler is ready before the user opts in via the subscribe card.
void registerServiceWorker();

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppGlobalStyles />
        <AuthProvider>
          <InnerApp />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
