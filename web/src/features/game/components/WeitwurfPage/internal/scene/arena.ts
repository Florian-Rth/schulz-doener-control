import { type Camera, Vector3 } from "three";
import { FLOOR_Y } from "@/components/DoenerStage/three";

// The fixed thrower's view over the bucket field. Distance follows the canvas
// aspect, so a narrow phone still sees all buckets side to side.
export const ARENA_FIELD_OF_VIEW = 42;
export const ARENA_TARGET = new Vector3(0, FLOOR_Y, -0.9);
/** Camera elevation above the floor, in radians. */
const ELEVATION = (48 * Math.PI) / 180;
const FIT_HALF_WIDTH = 1.9;
const FIT_HALF_HEIGHT = 2.6;

export const arenaCameraDistance = (aspect: number): number => {
  const tan = Math.tan(((ARENA_FIELD_OF_VIEW / 2) * Math.PI) / 180);
  return Math.max(FIT_HALF_HEIGHT / tan, FIT_HALF_WIDTH / (tan * Math.max(0.1, aspect)));
};

export const arenaCameraPosition = (aspect: number, target: Vector3): Vector3 => {
  const distance = arenaCameraDistance(aspect);
  return target.set(
    ARENA_TARGET.x,
    ARENA_TARGET.y + Math.sin(ELEVATION) * distance,
    ARENA_TARGET.z + Math.cos(ELEVATION) * distance,
  );
};

/** Where the next piece is held: bottom middle of the screen, close to the camera. */
export const HELD_NDC = { x: 0, y: -0.7 } as const;
export const HELD_DISTANCE = 2.4;

/** Writes the held piece's world position into `target`. */
export const heldPosition = (camera: Camera, target: Vector3): Vector3 =>
  target
    .set(HELD_NDC.x, HELD_NDC.y, 0.5)
    .unproject(camera)
    .sub(camera.position)
    .normalize()
    .multiplyScalar(HELD_DISTANCE)
    .add(camera.position);

/**
 * Writes the floor point under a screen point (NDC) into `target`. Points at
 * or above the horizon are clamped to a far point straight ahead.
 */
export const floorUnder = (camera: Camera, x: number, y: number, target: Vector3): Vector3 => {
  target.set(x, y, 0.5).unproject(camera).sub(camera.position);
  const down = Math.min(-1e-3, target.y);
  const reach = Math.min(60, (FLOOR_Y - camera.position.y) / down);
  return target.multiplyScalar(reach).add(camera.position).setY(FLOOR_Y);
};
