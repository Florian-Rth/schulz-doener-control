import { useThree } from "@react-three/fiber";
import { type FC, useEffect, useState } from "react";
import { Vector3 } from "three";
import { meatSpec, VEGGIE_SPECS } from "@/components/DoenerStage/three";
import {
  aimFromFling,
  PIECE_KINDS,
  type PieceKind,
  pickPieceKind,
  THROW_COOLDOWN_MS,
} from "../../../../scoring";
import { PiecePool } from "./PiecePool";
import { planThrow, type ThrowScratch } from "./plan-throw";
import { createThrowQueues } from "./throw-queue";

interface ThrowControllerProps {
  /** False before the start and after the whistle: swipes throw nothing. */
  active: boolean;
  onLanded: (kind: PieceKind, inBread: boolean) => void;
}

const SPECS = {
  fleisch: meatSpec("kalb"),
  tomate: VEGGIE_SPECS.tomate,
  gurke: VEGGIE_SPECS.gurke,
  zwiebel: VEGGIE_SPECS.zwiebeln,
  salat: VEGGIE_SPECS.salat,
  rotkohl: VEGGIE_SPECS.rotkohl,
} as const;

interface Gesture {
  pointerId: number;
  x: number;
  y: number;
  at: number;
}

// The Weitwurf inside the Döner stage: reads swipes on the canvas and throws a
// random ingredient per fling. Lazily loaded (three.js stays out of the main
// bundle). The camera stays put while playing — a swipe is a throw, not an orbit.
export const ThrowController: FC<ThrowControllerProps> = ({ active, onLanded }) => {
  const camera = useThree((state) => state.camera);
  const element = useThree((state) => state.gl.domElement);
  const controls = useThree((state) => state.controls);
  const [queues] = useState(createThrowQueues);
  const [scratch] = useState(
    (): ThrowScratch => ({
      right: new Vector3(),
      toward: new Vector3(),
      target: new Vector3(),
      spawn: new Vector3(),
    }),
  );

  useEffect(() => {
    if (controls === null || !("enabled" in controls)) {
      return;
    }
    controls.enabled = false;
    return () => {
      controls.enabled = true;
    };
  }, [controls]);

  useEffect(() => {
    if (!active) {
      return;
    }
    let gesture: Gesture | null = null;
    let lastThrowAt = Number.NEGATIVE_INFINITY;

    const onDown = (event: PointerEvent): void => {
      gesture = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        at: event.timeStamp,
      };
    };
    const onUp = (event: PointerEvent): void => {
      const start = gesture;
      gesture = null;
      if (start === null || start.pointerId !== event.pointerId) {
        return;
      }
      if (event.timeStamp - lastThrowAt < THROW_COOLDOWN_MS) {
        return;
      }
      const rect = element.getBoundingClientRect();
      const height = Math.max(1, rect.height);
      const aim = aimFromFling({
        dx: (event.clientX - start.x) / height,
        dy: (event.clientY - start.y) / height,
        durationMs: event.timeStamp - start.at,
      });
      if (aim === null) {
        return;
      }
      lastThrowAt = event.timeStamp;
      const startX = ((start.x - rect.left) / Math.max(1, rect.width)) * 2 - 1;
      const kind = pickPieceKind(Math.random());
      queues[kind].push(planThrow(camera, aim, startX, scratch, Math.random));
    };
    const onCancel = (): void => {
      gesture = null;
    };

    element.addEventListener("pointerdown", onDown);
    element.addEventListener("pointerup", onUp);
    element.addEventListener("pointercancel", onCancel);
    return () => {
      element.removeEventListener("pointerdown", onDown);
      element.removeEventListener("pointerup", onUp);
      element.removeEventListener("pointercancel", onCancel);
    };
  }, [active, element, camera, queues, scratch]);

  return (
    <>
      {PIECE_KINDS.map((kind, index) => (
        <PiecePool
          key={kind}
          kind={kind}
          spec={SPECS[kind]}
          poolIndex={index}
          queue={queues[kind]}
          onLanded={onLanded}
        />
      ))}
    </>
  );
};
