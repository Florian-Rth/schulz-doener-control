import { useEffect, useState } from "react";
import { type DoenerBuild, EMPTY_BUILD } from "./build";

export interface BuildReplayOptions {
  /** Pause the replay (e.g. until the stage is visible). */
  playing?: boolean;
  /** Time between two ingredients. */
  beatMs?: number;
  /** Time before the meat goes in. */
  startDelayMs?: number;
}

export interface BuildReplay {
  /** The partial build to hand to the stage. */
  build: DoenerBuild;
  /** True once everything is in. */
  done: boolean;
  /** Start over from an empty bread. */
  replay: () => void;
}

const signature = (build: DoenerBuild): string =>
  `${build.meat ?? ""}|${build.veggies.join(",")}|${build.sauces.join(",")}`;

const beatsOf = (build: DoenerBuild): number =>
  (build.meat === null ? 0 : 1) + build.veggies.length + build.sauces.length;

/** The first `beat` ingredients of `target`: meat, then each veggie, then each sauce. */
export const buildAtBeat = (target: DoenerBuild, beat: number): DoenerBuild => {
  const meatBeats = target.meat === null ? 0 : 1;
  const veggieBeats = Math.max(0, beat - meatBeats);
  const sauceBeats = Math.max(0, veggieBeats - target.veggies.length);
  return {
    meat: beat >= 1 ? target.meat : null,
    veggies: target.veggies.slice(0, veggieBeats),
    sauces: target.sauces.slice(0, sauceBeats),
  };
};

// Replays a Döner being built, one ingredient per beat — for screens that show
// a finished order (counter mode, celebration) instead of building one.
export const useBuildReplay = (
  target: DoenerBuild,
  { playing = true, beatMs = 650, startDelayMs = 450 }: BuildReplayOptions = {},
): BuildReplay => {
  const [beat, setBeat] = useState(0);
  const [previous, setPrevious] = useState(signature(target));

  // A different Döner starts from an empty bread (render-phase reset, no flicker).
  const current = signature(target);
  if (current !== previous) {
    setPrevious(current);
    setBeat(0);
  }

  const total = beatsOf(target);
  useEffect(() => {
    if (!playing || beat >= total) {
      return;
    }
    const timer = window.setTimeout(
      () => {
        setBeat((value) => value + 1);
      },
      beat === 0 ? startDelayMs : beatMs,
    );
    return () => {
      window.clearTimeout(timer);
    };
  }, [playing, beat, total, beatMs, startDelayMs]);

  return {
    build: beat === 0 ? EMPTY_BUILD : buildAtBeat(target, beat),
    done: beat >= total,
    replay: () => {
      setBeat(0);
    },
  };
};
