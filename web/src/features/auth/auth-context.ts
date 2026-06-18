import { createContext, useContext } from "react";
import type { AuthContextValue } from "./types";

export const AuthContext = createContext<AuthContextValue | null>(null);

// The single source of session truth for the app. Fed into the router context so
// the route guard can read auth status during `beforeLoad`. Throws outside the
// provider to make missing-wrapper bugs loud.
export const useAuth = (): AuthContextValue => {
  const value = useContext(AuthContext);
  if (value === null) {
    throw new Error("useAuth muss innerhalb von <AuthProvider> verwendet werden.");
  }
  return value;
};
