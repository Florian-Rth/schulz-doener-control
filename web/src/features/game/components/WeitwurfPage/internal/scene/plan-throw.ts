import type { Camera, Vector3 } from "three";
import { FLOOR_Y, GRAVITY } from "@/components/DoenerStage/three";
import { type ThrowAim, throwDistance } from "../../../../scoring";
import { floorUnder, HELD_NDC, heldPosition } from "./arena";
import type { PendingThrow } from "./throw-queue";

export interface ThrowScratch {
  from: Vector3;
  toward: Vector3;
  target: Vector3;
  spawn: Vector3;
}

/** The thrower's feet: throw distances count from here, whatever the camera does. */
export const THROW_LINE_Z = 4.5;
/** How far along the swipe the aim line is sampled on the screen (NDC). */
const AIM_SAMPLE = 0.3;
/** Pieces are aimed a bit above the floor: into the bucket, not under it. */
const AIM_HEIGHT = 0.35;
const MIN_REACH = 0.6;

// Turns an aim into a ballistic throw from the held piece. Straight lines on
// the screen are straight lines on the floor, so the swipe direction drawn
// from the held piece is the throw's heading; the power sets the distance.
// Writes into `scratch`, allocates only the result.
export const planThrow = (
  camera: Camera,
  aim: ThrowAim,
  aspect: number,
  scratch: ThrowScratch,
  random: () => number,
): PendingThrow => {
  const { from, toward, target, spawn } = scratch;
  // Swipe deltas are in canvas heights; NDC x spans the width.
  const sx = aim.dx / Math.max(0.1, aspect);
  const sy = -aim.dy;
  const length = Math.max(1e-6, Math.hypot(sx, sy));
  floorUnder(camera, HELD_NDC.x, HELD_NDC.y, from);
  floorUnder(
    camera,
    HELD_NDC.x + (sx / length) * AIM_SAMPLE,
    HELD_NDC.y + (sy / length) * AIM_SAMPLE,
    toward,
  );
  toward.sub(from).setY(0).normalize();

  const reach = Math.max(MIN_REACH, throwDistance(aim.power) - (THROW_LINE_Z - from.z));
  target
    .copy(from)
    .addScaledVector(toward, reach)
    .setY(FLOOR_Y + AIM_HEIGHT);
  heldPosition(camera, spawn);

  // Longer throws fly longer and come down steeper: into the bucket, not against its rim.
  const flight = 0.6 + 0.06 * spawn.distanceTo(target);
  return {
    spawn: { x: spawn.x, y: spawn.y, z: spawn.z },
    velocity: {
      x: (target.x - spawn.x) / flight,
      // Straight line over the flight time, plus what gravity takes away.
      y: (target.y - spawn.y) / flight + 0.5 * GRAVITY * flight,
      z: (target.z - spawn.z) / flight,
    },
    spin: {
      x: (random() - 0.5) * 24,
      y: (random() - 0.5) * 24,
      z: (random() - 0.5) * 24,
    },
  };
};
