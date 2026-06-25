// Captures the browser's non-standard `beforeinstallprompt` event so the install guide can offer a
// one-tap install on Android / Chromium desktop. The event fires once and early (often before React
// mounts), only when the app is installable and not already installed — so capture must start at
// module load and stash the event. iOS/Safari never fire it; there the guide falls back to text steps.
//
// Kept out of React (like push-browser) so the capture/prompt logic is plain and the React layer just
// subscribes. A small subscriber set lets a hook re-render via useSyncExternalStore when availability
// changes (prompt arrives, or is consumed / the app gets installed).

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: readonly string[];
  prompt: () => Promise<void>;
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export type InstallOutcome = "accepted" | "dismissed";

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let captureStarted = false;
const listeners = new Set<() => void>();

const notify = (): void => {
  for (const listener of listeners) {
    listener();
  }
};

// Begins listening for the install prompt. Idempotent and a no-op without a window (SSR / tests).
export const startInstallPromptCapture = (): void => {
  if (captureStarted || typeof window === "undefined") {
    return;
  }
  captureStarted = true;

  window.addEventListener("beforeinstallprompt", (event) => {
    // Suppress the browser's mini-infobar so we own when the prompt is shown.
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    notify();
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notify();
  });
};

// True when the browser has offered an installable prompt we can trigger one-tap.
export const canPromptInstall = (): boolean => deferredPrompt !== null;

// Triggers the captured install prompt. Resolves to the user's choice, or null when none is captured.
export const promptInstall = async (): Promise<InstallOutcome | null> => {
  if (deferredPrompt === null) {
    return null;
  }
  const event = deferredPrompt;
  await event.prompt();
  const choice = await event.userChoice;
  // The prompt can only be used once; drop it so the CTA hides afterwards.
  deferredPrompt = null;
  notify();
  return choice.outcome;
};

// Subscribes to availability changes; returns an unsubscribe. Pairs with canPromptInstall as the
// snapshot for useSyncExternalStore.
export const subscribeInstallPrompt = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

// Start capturing as soon as this module is imported (main.tsx imports it for the side effect).
startInstallPromptCapture();
