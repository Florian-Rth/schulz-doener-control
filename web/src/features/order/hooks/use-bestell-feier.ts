import { useEffect, useEffectEvent, useRef, useState } from "react";
import { pickLine, rollSeed } from "@/lib/funny-lines";
import { bestellFeierCopy } from "../copy";

/** The full celebration continues on its own after this long. */
export const FEIER_DURATION_MS = 4000;
/** Under prefers-reduced-motion only a short static card is shown. */
export const FEIER_REDUCED_DURATION_MS = 2500;

const prefersReducedMotion = (): boolean =>
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export interface UseBestellFeierResult {
  seed: number;
  line: string;
  reducedMotion: boolean;
  /** Ends the celebration — safe to call repeatedly (tap, button, timer), fires `onDone` once. */
  finish: () => void;
}

// Logic of the Bestell-Feier: one random line per celebration, the
// reduced-motion switch, and the auto-continue timer. Tap, "Weiter", Escape and
// the timer can all race to finish, so `onDone` is guarded to run only once.
export const useBestellFeier = (onDone: () => void): UseBestellFeierResult => {
  const [seed] = useState(rollSeed);
  const [reducedMotion] = useState(prefersReducedMotion);
  const finished = useRef(false);

  const finish = (): void => {
    if (finished.current) {
      return;
    }
    finished.current = true;
    onDone();
  };

  const onTimeout = useEffectEvent(() => {
    finish();
  });

  const durationMs = reducedMotion ? FEIER_REDUCED_DURATION_MS : FEIER_DURATION_MS;
  useEffect(() => {
    const timer = window.setTimeout(() => {
      onTimeout();
    }, durationMs);
    return () => {
      window.clearTimeout(timer);
    };
  }, [durationMs]);

  return { seed, line: pickLine(bestellFeierCopy.lines, seed), reducedMotion, finish };
};
