import { useTheme } from "@mui/material/styles";
import { useThree } from "@react-three/fiber";
import { type FC, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Vector3 } from "three";
import { gameCopy } from "../../../../copy";
import {
  aimFromFling,
  BUCKETS,
  type BucketId,
  type Bucket as BucketSpec,
  PIECE_KINDS,
  type PieceKind,
  THROW_COOLDOWN_MS,
} from "../../../../scoring";
import { ArenaCamera } from "./ArenaCamera";
import { Bucket } from "./Bucket";
import { HeldPiece } from "./HeldPiece";
import { PiecePool } from "./PiecePool";
import { PIECE_SPECS } from "./piece-specs";
import { planThrow, type ThrowScratch } from "./plan-throw";
import { createThrowQueues } from "./throw-queue";

interface ThrowControllerProps {
  /** False before the start and after the whistle: swipes throw nothing. */
  active: boolean;
  /** The piece in the hand: shown at the bottom, thrown on the next swipe. */
  nextKind: PieceKind;
  onThrow: () => void;
  onLanded: (kind: PieceKind, bucket: BucketSpec | null) => void;
}

interface Sample {
  x: number;
  y: number;
  at: number;
}

interface Gesture {
  pointerId: number;
  /** Recent pointer positions, oldest first — only the last RELEASE_WINDOW_MS matter. */
  samples: Sample[];
}

/** The throw's speed and direction come from this last stretch of the swipe. */
const RELEASE_WINDOW_MS = 100;

const sampleOf = (event: PointerEvent): Sample => ({
  x: event.clientX,
  y: event.clientY,
  at: event.timeStamp,
});

// The oldest sample still inside the release window (or the very first one).
const releaseStart = (samples: readonly Sample[], upAt: number): Sample | undefined =>
  samples.find((sample) => upAt - sample.at <= RELEASE_WINDOW_MS) ?? samples[samples.length - 1];

// The Weitwurf inside the stage's arena: buckets on the floor, the next piece
// in the hand, and swipes on the canvas that throw it. Lazily loaded (three.js
// stays out of the main bundle).
export const ThrowController: FC<ThrowControllerProps> = ({
  active,
  nextKind,
  onThrow,
  onLanded,
}) => {
  const theme = useTheme();
  const camera = useThree((state) => state.camera);
  const element = useThree((state) => state.gl.domElement);
  const [queues] = useState(createThrowQueues);
  const [scratch] = useState(
    (): ThrowScratch => ({
      from: new Vector3(),
      toward: new Vector3(),
      target: new Vector3(),
      spawn: new Vector3(),
    }),
  );
  const thrownAt = useRef(Number.NEGATIVE_INFINITY);
  // The round re-renders several times a second (its clock); the listeners
  // must survive that, or a swipe in progress is lost. They read the latest
  // piece and callback from here instead of re-subscribing.
  const hand = useRef({ nextKind, onThrow });
  useLayoutEffect(() => {
    hand.current = { nextKind, onThrow };
  });
  const lastThrowStamp = useRef(Number.NEGATIVE_INFINITY);
  const bucketColors: Record<BucketId, string> = {
    bambini: theme.palette.teal.main,
    stammkunde: theme.palette.gold.main,
    meister: theme.palette.primary.main,
  };

  useEffect(() => {
    if (!active) {
      return;
    }
    let gesture: Gesture | null = null;

    const onDown = (event: PointerEvent): void => {
      gesture = { pointerId: event.pointerId, samples: [sampleOf(event)] };
    };
    const onMove = (event: PointerEvent): void => {
      if (gesture === null || gesture.pointerId !== event.pointerId) {
        return;
      }
      const { samples } = gesture;
      samples.push(sampleOf(event));
      while (samples.length > 2 && event.timeStamp - (samples[1]?.at ?? 0) > RELEASE_WINDOW_MS) {
        samples.shift();
      }
    };
    const onUp = (event: PointerEvent): void => {
      const ended = gesture;
      gesture = null;
      if (ended === null || ended.pointerId !== event.pointerId) {
        return;
      }
      const start = releaseStart(ended.samples, event.timeStamp);
      if (start === undefined) {
        return;
      }
      if (event.timeStamp - lastThrowStamp.current < THROW_COOLDOWN_MS) {
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
      lastThrowStamp.current = event.timeStamp;
      thrownAt.current = performance.now();
      const aspect = rect.width / height;
      queues[hand.current.nextKind].push(planThrow(camera, aim, aspect, scratch, Math.random));
      hand.current.onThrow();
    };
    const onCancel = (): void => {
      gesture = null;
    };

    element.addEventListener("pointerdown", onDown);
    element.addEventListener("pointermove", onMove);
    element.addEventListener("pointerup", onUp);
    element.addEventListener("pointercancel", onCancel);
    return () => {
      element.removeEventListener("pointerdown", onDown);
      element.removeEventListener("pointermove", onMove);
      element.removeEventListener("pointerup", onUp);
      element.removeEventListener("pointercancel", onCancel);
    };
  }, [active, element, camera, queues, scratch]);

  return (
    <>
      <ArenaCamera />
      {BUCKETS.map((bucket) => (
        <Bucket
          key={bucket.id}
          bucket={bucket}
          name={gameCopy.bucketNames[bucket.id]}
          color={bucketColors[bucket.id]}
        />
      ))}
      <HeldPiece kind={nextKind} thrownAt={thrownAt} />
      {PIECE_KINDS.map((kind, index) => (
        <PiecePool
          key={kind}
          kind={kind}
          spec={PIECE_SPECS[kind]}
          poolIndex={index}
          queue={queues[kind]}
          onLanded={onLanded}
        />
      ))}
    </>
  );
};
