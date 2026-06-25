import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { isStandalonePwa } from "@/lib/push";
import { useClientConfig } from "../api";
import { GateSearchSchema } from "../schemas";
import type { GateDecision } from "../types";

// Routes inside the gated subtree that must stay reachable in a browser tab even with the gate on,
// so a user can finish the credential flow before installing. login & register live outside this
// layout already; passwort-aendern (forced password change) is the one nested route to exempt.
const EXEMPT_PATHS = new Set<string>(["/passwort-aendern"]);

// Developer bypass: append ?debug=<token> to use the app in a browser tab. A convenience, not an
// access-control boundary — real auth is the session cookie + CSRF, which the gate never touches.
const DEBUG_BYPASS_TOKEN = "doener";
const BYPASS_STORAGE_KEY = "dc_pwa_bypass";

const readPersistedBypass = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return window.localStorage.getItem(BYPASS_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
};

const persistBypass = (): void => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(BYPASS_STORAGE_KEY, "1");
  } catch {
    // Private-mode Safari throws on setItem — ignore; the in-URL param still works this session.
  }
};

// Logic layer for the PWA install gate. Decides whether the authenticated app renders, the install
// guide takes over, or a splash shows while the kill-switch config resolves. Auth-independent by
// design: it must never read the auth context, only the standalone/bypass/config signals.
export const usePwaGate = (): GateDecision => {
  const config = useClientConfig();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const search = useRouterState({ select: (state) => state.location.search });

  const bypassFromUrl = GateSearchSchema.safeParse(search).data?.debug === DEBUG_BYPASS_TOKEN;
  const [persistedBypass] = useState(readPersistedBypass);

  // Remember a fresh ?debug hit so the bypass sticks across later navigations that drop the param.
  useEffect(() => {
    if (bypassFromUrl) {
      persistBypass();
    }
  }, [bypassFromUrl]);

  if (config.isPending) {
    return "loading";
  }

  // Fail-open: a config hiccup must never brick the installed app or lock everyone out.
  const gateEnabled = config.data?.pwaGateEnabled ?? false;
  if (!gateEnabled) {
    return "allow";
  }

  if (EXEMPT_PATHS.has(pathname)) {
    return "allow";
  }

  if (isStandalonePwa() || bypassFromUrl || persistedBypass) {
    return "allow";
  }

  return "guide";
};
