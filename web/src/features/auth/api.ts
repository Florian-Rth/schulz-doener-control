import type { QueryClient } from "@tanstack/react-query";
import { CancelledError, useMutation, useQuery } from "@tanstack/react-query";
import { ApiError, apiClient } from "@/lib/api";
import { LoginResponseSchema, SessionSchema } from "./schemas";
import type { AuthStatus, LoginForm, LoginResponse, Session } from "./types";

export const authKeys = {
  session: ["auth", "session"] as const,
};

// Resolves the auth status straight from the query cache. The route guard uses
// this (via the router's queryClient) so it reads the *current* session right
// after a login mutation refetches it — with no React-render propagation lag.
export const resolveAuthStatus = (queryClient: QueryClient): AuthStatus => {
  const state = queryClient.getQueryState<Session | null>(authKeys.session);
  if (state === undefined || state.data === undefined) {
    return "loading";
  }
  return state.data ? "authenticated" : "anonymous";
};

export const ensureSession = async (queryClient: QueryClient): Promise<Session | null> =>
  queryClient.ensureQueryData<Session | null>({
    queryKey: authKeys.session,
    queryFn: ({ signal }) => fetchSession(signal),
  });

// A cancelled/aborted in-flight fetch — caused by a torn-down navigation or React
// StrictMode's throwaway dev mount (which removes the session query's observer and
// cancels the shared fetch mid-flight) — surfaces as a CancelledError/AbortError
// out of ensureQueryData. It is not a real failure.
const isCancelledError = (error: unknown): boolean => {
  if (error instanceof CancelledError) {
    return true;
  }
  return error instanceof Error && (error.name === "CancelledError" || error.name === "AbortError");
};

// Guard helper for route `beforeLoad`s: resolves the session and returns the auth
// status, tolerant of the benign cancellation above. It retries once (the churn
// has settled by the live navigation pass) so the guard still makes the correct
// redirect decision instead of throwing a CancelledError into the router. Returns
// "loading" only if both attempts are cancelled, in which case no redirect is made
// and the superseding navigation re-resolves.
export const ensureAuthStatus = async (queryClient: QueryClient): Promise<AuthStatus> => {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const session = await ensureSession(queryClient);
      return session ? "authenticated" : "anonymous";
    } catch (error) {
      if (!isCancelledError(error)) {
        throw error;
      }
    }
  }
  return "loading";
};

// Guard helper: resolves the session (cache or `GET /api/auth/me`) tolerant of
// the benign cancellation above and reports both the auth status and whether the
// caller is locked behind the forced password change. The `_auth` guard uses
// this to push a locked user onto /passwort-aendern. Returns `false` for
// `mustChangePassword` whenever the status is not "authenticated".
export const ensureSessionGate = async (
  queryClient: QueryClient,
): Promise<{ status: AuthStatus; mustChangePassword: boolean }> => {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const session = await ensureSession(queryClient);
      return {
        status: session ? "authenticated" : "anonymous",
        mustChangePassword: session?.mustChangePassword ?? false,
      };
    } catch (error) {
      if (!isCancelledError(error)) {
        throw error;
      }
    }
  }
  return { status: "loading", mustChangePassword: false };
};

// A freshly provisioned account is authenticated but locked: the backend's
// MustChangePasswordGate answers `GET /api/auth/me` with a 403 (every endpoint
// except change-password/logout is blocked until the flag clears). We have no
// profile payload in that state, so the session is represented by this sentinel
// — authenticated with `mustChangePassword` set — which the route guard reads to
// force the user onto /passwort-aendern. The placeholder profile fields are never
// rendered: the guard only ever lets a locked user reach the change-password page.
export const LOCKED_SESSION: Session = {
  userId: "",
  displayName: "",
  firstName: "",
  initials: "",
  avatarColorHex: "#000000",
  role: "",
  payPalHandleSet: false,
  payPalHandle: null,
  mustChangePassword: true,
};

// Fetches the current session. A 401 (anonymous) is mapped to `null` rather than
// thrown so the AuthProvider can render the anonymous state instead of erroring.
// A 403 (authenticated but forced-change-locked) is mapped to LOCKED_SESSION so
// the guard can route the caller to the password-change page.
const fetchSession = async (signal: AbortSignal): Promise<Session | null> => {
  try {
    const data = await apiClient.get("/api/auth/me", signal);
    return SessionSchema.parse(data);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    if (error instanceof ApiError && error.status === 403) {
      return LOCKED_SESSION;
    }
    throw error;
  }
};

export const useSessionQuery = () =>
  useQuery({
    queryKey: authKeys.session,
    queryFn: ({ signal }) => fetchSession(signal),
    retry: false,
    staleTime: 30 * 1000,
  });

const login = async (form: LoginForm): Promise<LoginResponse> => {
  const data = await apiClient.post("/api/auth/login", form);
  return LoginResponseSchema.parse(data);
};

export const useLogin = () =>
  useMutation({
    mutationFn: login,
  });

const logout = async (): Promise<void> => {
  await apiClient.post("/api/auth/logout");
};

export const useLogout = () =>
  useMutation({
    mutationFn: logout,
  });
