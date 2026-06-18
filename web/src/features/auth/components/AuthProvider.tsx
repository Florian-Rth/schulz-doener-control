import { useQueryClient } from "@tanstack/react-query";
import type { FC, ReactNode } from "react";
import { useEffect } from "react";
import { registerHardLogout } from "@/lib/api";
import { authKeys, useSessionQuery } from "../api";
import { AuthContext } from "../auth-context";
import type { AuthContextValue, AuthStatus, Session } from "../types";

interface AuthProviderProps {
  children: ReactNode;
}

const resolveStatus = (isPending: boolean, user: Session | null | undefined): AuthStatus => {
  if (isPending) {
    return "loading";
  }
  return user ? "authenticated" : "anonymous";
};

// Logic layer: turns the `GET /api/auth/me` query into the typed auth context
// and registers the hard-logout handler the apiClient invokes on an
// unrecoverable 401. Holds no JSX beyond the provider.
export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const queryClient = useQueryClient();
  const sessionQuery = useSessionQuery();

  useEffect(() => {
    registerHardLogout(() => {
      queryClient.setQueryData(authKeys.session, null);
    });
  }, [queryClient]);

  const value: AuthContextValue = {
    status: resolveStatus(sessionQuery.isPending, sessionQuery.data),
    user: sessionQuery.data ?? null,
    refresh: async () => {
      await queryClient.invalidateQueries({ queryKey: authKeys.session });
    },
    clear: () => {
      queryClient.setQueryData(authKeys.session, null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
