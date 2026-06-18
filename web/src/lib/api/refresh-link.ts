import { buildUrl } from "@/lib/api/config";

// Single-flight refresh: concurrent 401s share one in-flight refresh promise so
// we never fire `POST /api/auth/refresh` more than once at a time. Resolves to
// true when the access cookie was renewed, false on a hard failure (the caller
// then triggers the hard-logout path).
let inFlight: Promise<boolean> | null = null;

const doRefresh = async (): Promise<boolean> => {
  try {
    const response = await fetch(buildUrl("/api/auth/refresh"), {
      method: "POST",
      credentials: "include",
    });
    return response.ok;
  } catch {
    return false;
  }
};

export const attemptRefresh = (): Promise<boolean> => {
  if (inFlight === null) {
    inFlight = doRefresh().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
};

// The app registers a callback (after the router is built) that clears auth
// state and navigates to /login. Kept as module state so the apiClient — which
// must not import the router or React — can invoke it on an unrecoverable 401.
type HardLogoutHandler = () => void;

let hardLogoutHandler: HardLogoutHandler | null = null;

export const registerHardLogout = (handler: HardLogoutHandler): void => {
  hardLogoutHandler = handler;
};

export const triggerHardLogout = (): void => {
  if (hardLogoutHandler !== null) {
    hardLogoutHandler();
  }
};
