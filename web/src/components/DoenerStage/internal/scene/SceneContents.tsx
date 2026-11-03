import { useTheme } from "@mui/material/styles";
import {
  Environment,
  Lightformer,
  OrbitControls,
  PerformanceMonitor,
  Preload,
} from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, SMAA, ToneMapping, Vignette } from "@react-three/postprocessing";
import { Physics } from "@react-three/rapier";
import { ToneMappingMode } from "postprocessing";
import { type FC, type ReactNode, useEffect, useRef, useState } from "react";
import type { DoenerBuild } from "../../build";
import { Bread } from "./Bread";
import { DoenerFilling } from "./DoenerFilling";
import { ImpactShake } from "./ImpactShake";
import { KeyLight } from "./KeyLight";
import { GRAVITY } from "./physics";
import { ShadowUpdater } from "./ShadowUpdater";
import { Showroom } from "./Showroom";
import { ShadowPokeContext } from "./shadow-poke-context";

export interface SceneContentsProps {
  build: DoenerBuild;
  meatKeys: readonly string[];
  sauceKeys: readonly string[];
  presenting: boolean;
  gentle: boolean;
  /** Called on every hit on the bread, with the hit strength. */
  onHit?: (strength: number) => void;
  /** Extra scene content, rendered inside the physics world. */
  children?: ReactNode;
}

export const FIELD_OF_VIEW = 36;
// Half-extents the camera must always fit: the plate plus a margin for flying stuff.
const FIT_HALF_WIDTH = 2.1;
const FIT_HALF_HEIGHT = 1.5;
const CAMERA_TARGET: [number, number, number] = [0, -1.0, 0];

// Keeps the Döner + plate in frame on any canvas aspect (portrait phones need
// the camera further back). Distance is locked, the user can only orbit; on the
// final step the camera circles the Döner like a showroom car.
const FittedControls: FC<{ presenting: boolean }> = ({ presenting }) => {
  const aspect = useThree((state) => state.size.width / Math.max(1, state.size.height));
  const tan = Math.tan(((FIELD_OF_VIEW / 2) * Math.PI) / 180);
  const distance = Math.max(FIT_HALF_HEIGHT / tan, FIT_HALF_WIDTH / (tan * aspect));
  return (
    <OrbitControls
      makeDefault
      enablePan={false}
      enableZoom={false}
      minDistance={distance}
      maxDistance={distance}
      minPolarAngle={Math.PI * 0.28}
      maxPolarAngle={Math.PI * 0.5}
      target={CAMERA_TARGET}
      autoRotate={presenting}
      autoRotateSpeed={1.6}
      enableDamping
    />
  );
};

type Quality = "high" | "low";

// Phones start light; desktops start pretty. PerformanceMonitor may only step
// down, never back up: every switch rebuilds the post-processing chain and
// resizes the canvas, and flip-flopping between the two was a lag source itself.
const initialQuality = (): Quality =>
  typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches
    ? "low"
    : "high";

// Render resolution per quality level: crisp on "high", 1:1 pixels on "low".
const QualityDpr: FC<{ quality: Quality }> = ({ quality }) => {
  const setDpr = useThree((state) => state.setDpr);
  useEffect(() => {
    setDpr(quality === "high" ? Math.min(window.devicePixelRatio, 1.5) : 1);
  }, [quality, setDpr]);
  return null;
};

// Everything inside the canvas. Owns the "hit" feedback: every impact on the
// bread wobbles it and shakes the camera — the harder the throw, the more.
export const SceneContents: FC<SceneContentsProps> = ({
  build,
  meatKeys,
  sauceKeys,
  presenting,
  gentle,
  onHit: onHitOutside,
  children,
}) => {
  const theme = useTheme();
  const impact = useRef(0);
  const shake = useRef(0);
  const shadowPokes = useRef(0);
  const [quality, setQuality] = useState<Quality>(initialQuality);

  const onHit = (strength: number): void => {
    onHitOutside?.(strength);
    impact.current = Math.min(1.4, impact.current + strength);
    if (!gentle) {
      shake.current = Math.min(0.6, shake.current + strength * 1.2);
    }
  };

  return (
    <>
      <color attach="background" args={[theme.palette.navy.main]} />
      <fog attach="fog" args={[theme.palette.navy.main, 11, 22]} />

      <Environment resolution={256} frames={1}>
        <Lightformer
          form="rect"
          intensity={2.4}
          position={[0, 6, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[8, 6, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.4}
          color={theme.palette.teal.main}
          position={[-6, 1.5, -1]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[6, 2.5, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.6}
          color={theme.palette.gold.main}
          position={[6, 1, 2]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={[6, 2.5, 1]}
        />
        <Lightformer
          form="ring"
          intensity={2}
          color={theme.palette.primary.main}
          position={[0, 2, 7]}
          scale={3}
        />
      </Environment>
      <ambientLight intensity={0.15} />
      <KeyLight />
      <spotLight
        position={[-3.5, 4, -3]}
        angle={0.5}
        penumbra={0.8}
        intensity={30}
        color={theme.palette.teal.main}
      />

      {/* "vary": exactly one physics step per rendered frame. A fixed step makes a
          slow device run several steps per frame to catch up — which makes the
          next frame even slower. */}
      <Physics gravity={[0, -GRAVITY, 0]} timeStep="vary">
        <Showroom
          floorColor={theme.palette.navy.main}
          plateColor={theme.palette.label.main}
          accentColor={theme.palette.primary.main}
        />
        <Bread impact={impact} paperInk={theme.palette.primary.main} />
        <DoenerFilling
          build={build}
          meatKeys={meatKeys}
          sauceKeys={sauceKeys}
          onHit={onHit}
          gentle={gentle}
        />
        <ShadowPokeContext.Provider value={shadowPokes}>{children}</ShadowPokeContext.Provider>
      </Physics>

      <FittedControls presenting={presenting} />
      <ImpactShake intensity={shake} />

      <ShadowUpdater
        pokes={shadowPokes}
        activity={`${build.meat ?? ""}|${build.veggies.join(",")}|${build.sauces.join(",")}`}
      />
      {/* Compile every shader up front (all volleys are pre-mounted), so the
          first throw of each ingredient does not stall a frame. */}
      <Preload all />
      <PerformanceMonitor
        onDecline={() => {
          setQuality("low");
        }}
        onFallback={() => {
          setQuality("low");
        }}
      />
      <QualityDpr quality={quality} />
      {/* Full-screen passes are the first thing to go on weak devices. */}
      {quality === "high" ? (
        <EffectComposer multisampling={0}>
          <SMAA />
          <Bloom mipmapBlur levels={5} luminanceThreshold={0.9} intensity={0.8} />
          <Vignette offset={0.3} darkness={0.65} />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      ) : null}
    </>
  );
};
