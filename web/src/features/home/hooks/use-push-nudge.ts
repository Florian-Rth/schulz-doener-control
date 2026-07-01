import { useState } from "react";
import { currentPermission, isPushSupported, needsIosInstall } from "@/lib/push";

// Persisted-dismissal key for the home push-notification hint. Once dismissed it stays dismissed on
// this device (like the PWA bypass), so a user who does not want notifications is never nagged again.
const DISMISSED_STORAGE_KEY = "dc_push_nudge_dismissed";

const readDismissed = (): boolean => {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return window.localStorage.getItem(DISMISSED_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
};

const persistDismissed = (): void => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(DISMISSED_STORAGE_KEY, "1");
  } catch {
    // Private-mode Safari throws on setItem — ignore; the hint just reappears next session.
  }
};

// Whether prompting to enable notifications is actionable: only when they aren't already on and the
// user hasn't explicitly turned them off. "granted" = already enabled → nothing to nudge. "denied" =
// the user chose no (re-enabling needs browser settings) → don't nag. "default" = never asked → the
// one state worth a gentle hint. iOS-in-a-tab is surfaced too, since installing unlocks push.
const isNudgeActionable = (): boolean => {
  const permission = currentPermission();
  if (permission === "granted" || permission === "denied") {
    return false;
  }
  return isPushSupported() || needsIosInstall();
};

// Home hint that invites a user without notifications to switch them on (so they hear about a fresh
// Döner-Tag). Reads the browser push state via @/lib/push — no dependency on the push feature — and
// keeps the once-and-done dismissal in localStorage.
export const usePushNudge = (): { visible: boolean; dismiss: () => void } => {
  const [dismissed, setDismissed] = useState(readDismissed);
  const [actionable] = useState(isNudgeActionable);

  const dismiss = (): void => {
    setDismissed(true);
    persistDismissed();
  };

  return { visible: actionable && !dismissed, dismiss };
};
