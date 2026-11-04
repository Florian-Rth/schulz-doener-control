import { useState } from "react";
import { type FortuneWheelSlice, useFortuneWheel } from "@/components";
import {
  playWheelFanfare,
  playWheelSadTrombone,
  playWheelTick,
  unlockWheelAudio,
} from "@/lib/audio";
import { useFunnyLine } from "@/lib/use-funny-line";
import { homeCopy, wheelExcusedLine, wheelVerdict } from "../copy";
import { useDashboardContext } from "../dashboard-context";
import type { PickupWheel } from "../types";

const WATCHED_KEY = "doener.pickupWheel.watchedSpinId";

// Which spin this device has already watched — a per-device convenience, so storage failures
// (private mode, blocked site data) just mean the "Rad drehen" button shows again.
const readWatchedSpinId = (): string | null => {
  try {
    return window.localStorage.getItem(WATCHED_KEY);
  } catch {
    return null;
  }
};

const markWatched = (spinId: string): void => {
  try {
    window.localStorage.setItem(WATCHED_KEY, spinId);
  } catch {
    // Not remembering is harmless: the wheel simply offers to spin again next time.
  }
};

export type WheelPhase = "unwatched" | "spinning" | "revealed";

export interface PickupWheelState {
  phase: WheelPhase;
  slices: FortuneWheelSlice[];
  rotation: number;
  highlightIndex: number | null;
  headline: string;
  excuseLabel: string;
  canExcuse: boolean;
  /** The chosen one, revealed, with nobody left to pass it to. */
  hasNoEscape: boolean;
  excusedLine: string | null;
  spin: () => void;
  isExcuseDialogOpen: boolean;
  openExcuseDialog: () => void;
  closeExcuseDialog: () => void;
  confirmExcuse: () => void;
  isExcusing: boolean;
}

// Logic for the Abholer-Glücksrad card. The server already drew the winner; this hook only plays
// the show: tap → audio unlocked by the gesture → rAF spin with ticks → verdict jingle. Mount it
// keyed by spinId so a re-spin starts from a fresh, unwatched state.
export const usePickupWheel = (wheel: PickupWheel, dayId: string): PickupWheelState => {
  const { excusePickupWheel, isExcusingPickupWheel } = useDashboardContext();
  const chosenIndex = Math.max(
    wheel.candidates.findIndex((candidate) => candidate.isChosen),
    0,
  );
  const [phase, setPhase] = useState<WheelPhase>(() =>
    readWatchedSpinId() === wheel.spinId ? "revealed" : "unwatched",
  );
  const [isExcuseDialogOpen, setExcuseDialogOpen] = useState(false);
  const control = useFortuneWheel({
    sliceCount: wheel.candidates.length,
    initialIndex: phase === "revealed" ? chosenIndex : null,
  });

  const intro = useFunnyLine(wheel.round > 1 ? homeCopy.wheelRespinIntros : homeCopy.wheelIntros);
  const verdictMe = useFunnyLine(homeCopy.wheelVerdictMeTitles);
  const excuseLabel = useFunnyLine(homeCopy.wheelExcuseButtons);

  const spin = (): void => {
    unlockWheelAudio();
    setPhase("spinning");
    void control.spin(chosenIndex, { onTick: playWheelTick }).then(() => {
      setPhase("revealed");
      markWatched(wheel.spinId);
      if (wheel.amIChosen) {
        playWheelSadTrombone();
      } else {
        playWheelFanfare();
      }
    });
  };

  const verdict = wheel.amIChosen ? verdictMe : wheelVerdict(wheel.chosenName);
  const isRevealed = phase === "revealed";

  return {
    phase,
    slices: wheel.candidates.map((candidate) => ({
      label: candidate.name.split(" ")[0] ?? candidate.name,
      color: candidate.colorHex,
    })),
    rotation: control.rotation,
    highlightIndex: isRevealed ? chosenIndex : null,
    headline: isRevealed ? verdict : phase === "spinning" ? homeCopy.wheelSpinning : intro,
    excuseLabel,
    canExcuse: isRevealed && wheel.canExcuse,
    hasNoEscape: isRevealed && wheel.amIChosen && !wheel.canExcuse,
    excusedLine: wheel.excusedNames.length > 0 ? wheelExcusedLine(wheel.excusedNames) : null,
    spin,
    isExcuseDialogOpen,
    openExcuseDialog: () => {
      setExcuseDialogOpen(true);
    },
    closeExcuseDialog: () => {
      setExcuseDialogOpen(false);
    },
    confirmExcuse: () => {
      excusePickupWheel(dayId);
      setExcuseDialogOpen(false);
    },
    isExcusing: isExcusingPickupWheel,
  };
};
