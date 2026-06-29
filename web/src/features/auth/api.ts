import type { QueryClient } from "@tanstack/react-query";
import { CancelledError, useMutation, useQuery } from "@tanstack/react-query";
import { redirect } from "@tanstack/react-router";
import { ApiError, apiClient } from "@/lib/api";
import { LoginResponseSchema, RegisterResponseSchema, SessionSchema } from "./schemas";
import type {
  AuthStatus,
  LoginForm,
  LoginResponse,
  RegisterForm,
  RegisterResponse,
  Session,
} from "./types";

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

// Role guard for route `beforeLoad`s: resolves the session (cache or
// `GET /api/auth/me`) and throws a redirect to "/" unless the caller's role
// matches `requiredRole`. The comparison is case-insensitive for safety even
// though the backend emits PascalCase ("Admin" | "Employee"). It must run AFTER
// the `_auth` authentication + must-change gating (its parent), so an anonymous
// or locked caller has already been redirected by the time this runs; here we
// only decide on role. A missing/cancelled session is treated as not having the
// role and is bounced home rather than left on the admin route.
export const ensureRole = async (queryClient: QueryClient, requiredRole: string): Promise<void> => {
  const session = await ensureSession(queryClient);
  if (session === null || session.role.toLowerCase() !== requiredRole.toLowerCase()) {
    throw redirect({ to: "/" });
  }
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
  workEmail: null,
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

interface RegisterArgs {
  form: RegisterForm;
  /**
   * Optional registration secret key lifted from the QR-code URL
   * (`/register?secretKey=…`, with `?code=` kept as a legacy alias). Sent as
   * `secretKey` only when present; omitted otherwise (open registration).
   */
  secretKey?: string;
}

// Self-registration. Anonymous endpoint; issues no session, so there is nothing
// to invalidate — the user logs in afterward. The optional PayPal handle is sent
// as null when left blank, and the secret key only when one is present. We send
// it under all three names (`secretKey` plus the legacy `code` / `inviteCode`
// aliases) so the request works against either the new or the old backend. A 409
// (duplicate username) / 403 (wrong/missing secret key) / 400 (validation)
// surfaces as an ApiError, the same shape login uses, so the form hook can branch
// on it.
const register = async ({ form, secretKey }: RegisterArgs): Promise<RegisterResponse> => {
  const handle = form.payPalHandle.trim();
  const workEmail = form.workEmail.trim();
  const data = await apiClient.post("/api/auth/register", {
    username: form.username,
    displayName: form.displayName,
    payPalHandle: handle === "" ? null : handle,
    workEmail: workEmail === "" ? null : workEmail,
    password: form.password,
    ...(secretKey !== undefined ? { secretKey, code: secretKey, inviteCode: secretKey } : {}),
  });
  return RegisterResponseSchema.parse(data);
};

export const useRegister = () =>
  useMutation({
    mutationFn: register,
  });

const logout = async (): Promise<void> => {
  await apiClient.post("/api/auth/logout");
};

export const useLogout = () =>
  useMutation({
    mutationFn: logout,
  });
