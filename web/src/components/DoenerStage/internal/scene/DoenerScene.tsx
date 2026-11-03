import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Canvas } from "@react-three/fiber";
import { type FC, type ReactNode, Suspense, useState } from "react";
import { PCFShadowMap } from "three";
import type { DoenerBuild } from "../../build";
import { doenerStageCopy } from "../../copy";
import { FIELD_OF_VIEW, SceneContents } from "./SceneContents";

export interface DoenerSceneProps {
  build: DoenerBuild;
  meatKeys: readonly string[];
  sauceKeys: readonly string[];
  presenting: boolean;
  onHit?: (strength: number) => void;
  children?: ReactNode;
}

// Start low and slightly from the side, looking into the open front of the Döner.
const START_ANGLE = 0.22;
const START_POSITION: [number, number, number] = [
  Math.sin(START_ANGLE) * 9,
  1.0,
  Math.cos(START_ANGLE) * 9,
];

const detectWebGl = (): boolean => {
  try {
    const canvas = document.createElement("canvas");
    return canvas.getContext("webgl2") !== null || canvas.getContext("webgl") !== null;
  } catch {
    return false;
  }
};

const prefersReducedMotion = (): boolean =>
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// The three.js stage. Loaded lazily (three.js + Rapier are big), so the rest of
// the order screen never pays for it.
export const DoenerScene: FC<DoenerSceneProps> = ({
  build,
  meatKeys,
  sauceKeys,
  presenting,
  onHit,
  children,
}) => {
  const [webGl] = useState(detectWebGl);
  const [gentle] = useState(prefersReducedMotion);

  if (!webGl) {
    return (
      <Stack sx={{ flex: 1, alignItems: "center", justifyContent: "center", px: 3 }}>
        <Typography sx={{ color: "navy.contrastText", textAlign: "center", fontWeight: 600 }}>
          {doenerStageCopy.noWebgl}
        </Typography>
      </Stack>
    );
  }

  return (
    <Canvas
      shadows={{ type: PCFShadowMap }}
      dpr={1}
      camera={{ fov: FIELD_OF_VIEW, position: START_POSITION }}
      // ACES on the renderer for the "low" quality path. With post-processing,
      // the scene renders into a render target (no tone mapping there) and the
      // ToneMapping effect applies ACES once at the end.
      gl={{ antialias: true }}
      aria-label={doenerStageCopy.sceneLabel}
      role="img"
    >
      {/* Rapier's WASM loads asynchronously; render nothing until it is ready. */}
      <Suspense fallback={null}>
        <SceneContents
          build={build}
          meatKeys={meatKeys}
          sauceKeys={sauceKeys}
          presenting={presenting}
          gentle={gentle}
          onHit={onHit}
        >
          {children}
        </SceneContents>
      </Suspense>
    </Canvas>
  );
};
