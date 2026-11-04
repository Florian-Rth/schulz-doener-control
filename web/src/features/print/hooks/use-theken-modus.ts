import { type KeyboardEvent, type TouchEvent, useRef, useState } from "react";
import type { PrintLine } from "@/features/home";
import { rollSeed } from "@/lib/funny-lines";
import { thekenProgress } from "../copy";
import { useWakeLock } from "./use-wake-lock";

// A horizontal swipe must travel this far (and further than it moves vertically).
const SWIPE_MIN_PX = 56;

export interface ThekenModusState {
  lines: PrintLine[];
  /** The line on screen, or null on the final "Alles bestellt" screen. */
  current: PrintLine | null;
  /** 0-based screen index; `lines.length` is the final screen. */
  index: number;
  isFinished: boolean;
  /** "3 / 12". */
  progressLabel: string;
  /** 0 … 100 for the progress bar. */
  progressValue: number;
  canGoBack: boolean;
  /** True on the last order — the next step is the final screen. */
  isLastLine: boolean;
  next: () => void;
  back: () => void;
  restart: () => void;
  close: () => void;
  /** Rolled once per opening — feeds `pickLine` so lines stay put on re-render. */
  seed: number;
  onTouchStart: (event: TouchEvent) => void;
  onTouchEnd: (event: TouchEvent) => void;
  onKeyDown: (event: KeyboardEvent) => void;
}

interface UseThekenModusArgs {
  lines: PrintLine[];
  onClose: () => void;
}

// Logic layer of the Theken-Modus: steps through the print lines one per
// screen (buttons, swipe, arrow keys), ends on a final screen and keeps the
// screen awake while it is open (mounted only while the dialog is open).
export const useThekenModus = ({ lines, onClose }: UseThekenModusArgs): ThekenModusState => {
  const [index, setIndex] = useState(0);
  const [seed] = useState(rollSeed);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  useWakeLock(true);

  const total = lines.length;
  const isFinished = index >= total;

  const next = (): void => {
    setIndex((value) => Math.min(value + 1, total));
  };
  const back = (): void => {
    setIndex((value) => Math.max(value - 1, 0));
  };

  return {
    lines,
    current: lines[index] ?? null,
    index,
    isFinished,
    progressLabel: thekenProgress(Math.min(index + 1, total), total),
    progressValue: total === 0 ? 100 : (Math.min(index + 1, total) / total) * 100,
    canGoBack: index > 0,
    isLastLine: index === total - 1,
    next,
    back,
    restart: () => {
      setIndex(0);
    },
    close: onClose,
    seed,
    onTouchStart: (event) => {
      const touch = event.touches[0];
      touchStart.current = touch === undefined ? null : { x: touch.clientX, y: touch.clientY };
    },
    onTouchEnd: (event) => {
      const start = touchStart.current;
      const touch = event.changedTouches[0];
      touchStart.current = null;
      if (start === null || touch === undefined) {
        return;
      }
      const deltaX = touch.clientX - start.x;
      const deltaY = touch.clientY - start.y;
      if (Math.abs(deltaX) < SWIPE_MIN_PX || Math.abs(deltaX) <= Math.abs(deltaY)) {
        return;
      }
      if (deltaX < 0) {
        next();
      } else {
        back();
      }
    },
    onKeyDown: (event) => {
      if (event.key === "ArrowRight") {
        next();
      } else if (event.key === "ArrowLeft") {
        back();
      }
    },
  };
};
