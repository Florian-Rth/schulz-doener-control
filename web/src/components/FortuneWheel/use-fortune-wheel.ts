import { useEffect, useRef, useState } from "react";
import { bordersPassed, easeOutQuart, restingRotation, spinTarget } from "./wheel-geometry";

const FULL_TURNS = 6;
const SPIN_MS = 6500;
const REDUCED_MOTION_SPIN_MS = 1200;

export interface SpinOptions {
  /** Fired every time the pointer passes a slice border. */
  onTick?: () => void;
}

export interface FortuneWheelControl {
  rotation: number;
  isSpinning: boolean;
  /** Spins to `index` and resolves once the wheel has stopped. */
  spin: (index: number, options?: SpinOptions) => Promise<void>;
}

interface UseFortuneWheelArgs {
  sliceCount: number;
  /** Slice to rest on initially (an already-watched result); null = neutral rotation 0. */
  initialIndex: number | null;
}

const prefersReducedMotion = (): boolean =>
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Drives the wheel's rotation frame by frame (rAF) rather than via a CSS transition, so the
// caller can hear a tick exactly when the pointer crosses a slice border.
export const useFortuneWheel = ({
  sliceCount,
  initialIndex,
}: UseFortuneWheelArgs): FortuneWheelControl => {
  const [rotation, setRotation] = useState<number>(() =>
    initialIndex === null ? 0 : restingRotation(sliceCount, initialIndex),
  );
  const [isSpinning, setIsSpinning] = useState(false);
  const frameRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    },
    [],
  );

  const spin = (index: number, options?: SpinOptions): Promise<void> => {
    const from = rotation;
    const to = spinTarget(from, sliceCount, index, FULL_TURNS, Math.random() * 2 - 1);
    const duration = prefersReducedMotion() ? REDUCED_MOTION_SPIN_MS : SPIN_MS;
    setIsSpinning(true);

    return new Promise((resolve) => {
      let startedAt: number | null = null;
      let lastBorder = bordersPassed(from, sliceCount);

      const step = (now: number): void => {
        startedAt ??= now;
        const progress = Math.min((now - startedAt) / duration, 1);
        const current = from + (to - from) * easeOutQuart(progress);
        setRotation(current);

        const border = bordersPassed(current, sliceCount);
        if (border !== lastBorder) {
          lastBorder = border;
          options?.onTick?.();
        }

        if (progress < 1) {
          frameRef.current = requestAnimationFrame(step);
        } else {
          frameRef.current = null;
          setIsSpinning(false);
          resolve();
        }
      };

      frameRef.current = requestAnimationFrame(step);
    });
  };

  return { rotation, isSpinning, spin };
};
