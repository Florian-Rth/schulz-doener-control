import type { Camera, Vector3 } from "three";
import { BREAD, breadToWorld, GRAVITY, gapMiddleY } from "@/components/DoenerStage/three";
import type { ThrowAim } from "../../../../scoring";
import type { PendingThrow } from "./throw-queue";

export interface ThrowScratch {
  right: Vector3;
  toward: Vector3;
  target: Vector3;
  spawn: Vector3;
}

/** Depth of the sweet spot in the gap (bread-local z, towards the open front). */
const SWEET_SPOT_Z = -0.2;
/** How far a throw lands short / long per unit of missing / extra reach. */
const REACH_SPREAD = 2.6;
/** Pieces appear this far in front of the camera, at the bottom of the screen. */
const SPAWN_DISTANCE = 2.2;
const SPAWN_NDC_Y = -0.9;
const FLIGHT_SECONDS = 0.62;

// Turns an aim into a ballistic throw from the bottom of the screen: a perfect
// aim lands in the middle of the gap, reach and lateral move the landing point
// along the camera's view. Writes into `scratch`, allocates only the result.
export const planThrow = (
  camera: Camera,
  aim: ThrowAim,
  /** Where the swipe started, -1 (left edge) … 1 (right edge). */
  startX: number,
  scratch: ThrowScratch,
  random: () => number,
): PendingThrow => {
  const { right, toward, target, spawn } = scratch;
  right.setFromMatrixColumn(camera.matrixWorld, 0).setY(0).normalize();
  toward.copy(camera.position).setY(0).normalize();

  breadToWorld(0, gapMiddleY(SWEET_SPOT_Z), SWEET_SPOT_Z, target)
    .addScaledVector(right, aim.lateral * BREAD.halfLength)
    .addScaledVector(toward, (1 - aim.reach) * REACH_SPREAD);

  spawn
    .set(Math.max(-0.7, Math.min(0.7, startX)), SPAWN_NDC_Y, 0.5)
    .unproject(camera)
    .sub(camera.position)
    .normalize()
    .multiplyScalar(SPAWN_DISTANCE)
    .add(camera.position);

  const flight = FLIGHT_SECONDS;
  return {
    spawn: { x: spawn.x, y: spawn.y, z: spawn.z },
    velocity: {
      x: (target.x - spawn.x) / flight,
      // Straight line over the flight time, plus what gravity takes away.
      y: (target.y - spawn.y) / flight + 0.5 * GRAVITY * flight,
      z: (target.z - spawn.z) / flight,
    },
    spin: {
      x: (random() - 0.5) * 30,
      y: (random() - 0.5) * 30,
      z: (random() - 0.5) * 30,
    },
  };
};
