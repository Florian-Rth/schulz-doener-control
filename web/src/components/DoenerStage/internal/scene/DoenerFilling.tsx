import type { FC } from "react";
import { type DoenerBuild, VEGGIE_KEYS } from "../../build";
import { meatSpec, sauceColor, VEGGIE_SPECS } from "./food";
import { IngredientBatch } from "./IngredientBatch";
import { SauceStream } from "./SauceStream";

interface DoenerFillingProps {
  build: DoenerBuild;
  /** Every meat / sauce the menu offers — each one can be thrown in (and out). */
  meatKeys: readonly string[];
  sauceKeys: readonly string[];
  onHit: (strength: number) => void;
  gentle: boolean;
}

const seedFor = (key: string): number => {
  let hash = 17;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return hash;
};

// Everything that can end up in (or next to) the bread. Physics does the
// stacking, so there is no layout here — only what is in and what is out.
export const DoenerFilling: FC<DoenerFillingProps> = ({
  build,
  meatKeys,
  sauceKeys,
  onHit,
  gentle,
}) => (
  <>
    {meatKeys.map((key) => (
      <IngredientBatch
        key={key}
        spec={meatSpec(key)}
        seed={seedFor(key)}
        active={build.meat === key}
        onHit={onHit}
        gentle={gentle}
      />
    ))}
    {VEGGIE_KEYS.map((key) => (
      <IngredientBatch
        key={key}
        spec={VEGGIE_SPECS[key]}
        seed={seedFor(key)}
        active={build.veggies.includes(key)}
        onHit={onHit}
        gentle={gentle}
      />
    ))}
    {sauceKeys.map((key) => (
      <SauceStream
        key={key}
        color={sauceColor(key)}
        seed={seedFor(key)}
        active={build.sauces.includes(key)}
        onHit={onHit}
        gentle={gentle}
      />
    ))}
  </>
);
