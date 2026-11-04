import { useEffect } from "react";

// Keeps the screen on while `active` (the Chef holds the phone up at the
// counter). Feature-detected: browsers without the Screen Wake Lock API, or a
// denied request, simply let the screen dim as usual. The browser drops the
// lock whenever the tab is hidden, so it is re-requested on return.
export const useWakeLock = (active: boolean): void => {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) {
      return;
    }
    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const request = async (): Promise<void> => {
      try {
        const lock = await navigator.wakeLock.request("screen");
        if (cancelled) {
          void lock.release();
        } else {
          sentinel = lock;
        }
      } catch {
        // Denied (battery saver, no user gesture …) — the screen just dims.
      }
    };

    const onVisibilityChange = (): void => {
      if (document.visibilityState === "visible") {
        void request();
      }
    };

    void request();
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      void sentinel?.release();
    };
  }, [active]);
};
