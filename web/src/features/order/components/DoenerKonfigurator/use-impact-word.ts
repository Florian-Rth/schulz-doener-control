import { useState } from "react";
import { konfiguratorCopy } from "../../copy";
import { pickLine } from "../../funny-lines";
import type { DoenerBuild } from "../../hooks/use-doener-konfigurator";

export interface ImpactWord {
  /** Changes on every new burst — used as React key to restart the animation. */
  id: number;
  text: string;
}

// The build object is recreated on every render, so compare by content.
const signature = (build: DoenerBuild): string =>
  `${build.meat ?? ""}|${build.veggies.join(",")}|${build.sauces.join(",")}`;

const countSolids = (build: DoenerBuild): number =>
  (build.meat === null ? 0 : 1) + build.veggies.length;

// Prime stride: consecutive hits shout different words.
const WORD_STRIDE = 7;

// A comic word every time something new goes into the bread. Detected during
// render by comparing with the previous build (no effect, no extra commit).
export const useImpactWord = (build: DoenerBuild, seed: number): ImpactWord | null => {
  const [previous, setPrevious] = useState(build);
  const [word, setWord] = useState<ImpactWord | null>(null);

  if (signature(previous) !== signature(build)) {
    setPrevious(build);
    const id = (word?.id ?? 0) + 1;
    const meatChanged = build.meat !== null && build.meat !== previous.meat;
    if (meatChanged || countSolids(build) > countSolids(previous)) {
      setWord({ id, text: pickLine(konfiguratorCopy.impactWords, seed + id * WORD_STRIDE) });
    } else if (build.sauces.length > previous.sauces.length) {
      setWord({ id, text: pickLine(konfiguratorCopy.sauceWords, seed + id * WORD_STRIDE) });
    }
  }

  return word;
};
