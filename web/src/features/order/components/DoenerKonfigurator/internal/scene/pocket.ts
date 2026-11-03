import type { Vector3 } from "three";

// The Döner lies on its side, like the one at the counter: a bottom slab on the
// plate and a seeded lid hinged at the back. The gap between them is open to
// the front and both sides — you look straight into the filling.
//
// Bread-local frame: origin on the plate surface under the Döner, x along its
// length, z towards the camera (the open front), y up.

/** The plate the bread lies on (top surface height). */
export const PLATE_Y = -1.9;
export const PLATE_RADIUS = 2.2;
/** The showroom floor around the plate — where the mess ends up. */
export const FLOOR_Y = PLATE_Y - 0.16;

export const BREAD = {
  /** Half the length of the bread (x). */
  halfLength: 1.55,
  /** Half its depth, hinge at the back to open front (z). */
  halfDepth: 0.9,
  /** Thickness of the bottom slab's crust half and its flat cut face. */
  bottomCrust: 0.22,
  bottomCrumb: 0.06,
  /** The lid is puffier — that is where all the seeds are. */
  lidCrust: 0.42,
  lidCrumb: 0.06,
  /** How far the lid is opened (radians around the back hinge). */
  lidAngle: 0.62,
} as const;

/** Top of the bottom slab's cut face — the floor of the filling. */
export const FILLING_FLOOR_Y = BREAD.bottomCrust + BREAD.bottomCrumb;

/** Height of the gap between the slabs at depth z (local), at its middle. */
export const gapMiddleY = (z: number): number =>
  FILLING_FLOOR_Y + (z + BREAD.halfDepth) * Math.sin(BREAD.lidAngle) * 0.42;

/** Converts a point in the bread-local frame to world space, written into `target`. */
export const breadToWorld = (x: number, y: number, z: number, target: Vector3): Vector3 =>
  target.set(x, y + PLATE_Y, z);
