import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { type FC, lazy, type ReactNode, Suspense } from "react";
import { pickLine } from "@/lib/funny-lines";
import type { DoenerBuild } from "./build";
import { doenerStageCopy } from "./copy";
import { KNOWN_MEAT_KEYS, KNOWN_SAUCE_KEYS } from "./internal/scene/food";

// three.js + Rapier are only downloaded when a stage is actually shown.
const DoenerScene = lazy(() =>
  import("./internal/scene/DoenerScene").then((module) => ({ default: module.DoenerScene })),
);

export interface DoenerStageProps {
  /** What is in the bread. Every change throws the new ingredients in. */
  build: DoenerBuild;
  /**
   * "arena": the same showroom, but an empty floor — no bread, no plate, no
   * orbit camera. For games whose children place their own targets and camera.
   */
  scenery?: "doener" | "arena";
  /** Turntable mode: the camera circles the Döner like a showroom car. */
  presenting?: boolean;
  /** Seeds the playful loading line — roll once per screen with `rollSeed`. */
  seed?: number;
  /**
   * Option keys to pre-mount, so their shaders compile before the first throw.
   * Defaults to every meat / sauce with a dedicated look, plus the build's own.
   */
  meatKeys?: readonly string[];
  sauceKeys?: readonly string[];
  /** Every hit on the bread, with its strength (≈ 0.03 lettuce … 0.1 meat). */
  onHit?: (strength: number) => void;
  /**
   * Extra 3D content, rendered inside the physics world (games …).
   * It must come from a lazily imported module so three.js stays out of the
   * main bundle — see `./three.ts`.
   */
  children?: ReactNode;
  /** HTML on top of the canvas (scores, captions …). */
  overlay?: ReactNode;
}

const withKeys = (keys: readonly string[], extra: readonly (string | null)[]): string[] => {
  const result = [...keys];
  for (const key of extra) {
    if (key !== null && !result.includes(key)) {
      result.push(key);
    }
  }
  return result;
};

const StageLoading: FC<{ seed: number }> = ({ seed }) => (
  <Stack sx={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 1.5 }}>
    <CircularProgress size={28} />
    <Typography sx={{ fontSize: "0.8125rem", color: "rgba(255,255,255,.75)" }}>
      {pickLine(doenerStageCopy.loading, seed)}
    </Typography>
  </Stack>
);

// The shared 3D Döner showroom: a lying Döner on kraft paper that ingredients
// are thrown into with real physics. Fills its parent (give the parent a
// height); the navy background belongs to the scene.
export const DoenerStage: FC<DoenerStageProps> = ({
  build,
  scenery = "doener",
  presenting = false,
  seed = 0,
  meatKeys,
  sauceKeys,
  onHit,
  children,
  overlay,
}) => {
  const doener = scenery === "doener";

  return (
    <Stack sx={{ flex: 1, minHeight: 0, position: "relative", touchAction: "none" }}>
      <Suspense fallback={<StageLoading seed={seed} />}>
        <DoenerScene
          scenery={scenery}
          build={build}
          meatKeys={doener ? withKeys(meatKeys ?? KNOWN_MEAT_KEYS, [build.meat]) : []}
          sauceKeys={doener ? withKeys(sauceKeys ?? KNOWN_SAUCE_KEYS, build.sauces) : []}
          presenting={presenting}
          onHit={onHit}
        >
          {children}
        </DoenerScene>
      </Suspense>
      {overlay}
    </Stack>
  );
};
