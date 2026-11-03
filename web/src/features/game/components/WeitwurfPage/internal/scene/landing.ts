import { BREAD, FILLING_FLOOR_Y, PLATE_Y } from "@/components/DoenerStage/three";

// Where a piece came to rest decides hit or Sauerei. Lying on the plate next
// to the bread or on the floor is a miss; anything inside the bread's
// footprint and above the plate (in the gap, on the filling, even on the lid)
// counts as "in the Döner".
const LENGTH_SLACK = 1.05;
const MIN_HEIGHT = FILLING_FLOOR_Y * 0.5;
const MAX_HEIGHT = 2;

export const isInBread = (x: number, y: number, z: number): boolean => {
  const height = y - PLATE_Y;
  return (
    Math.abs(x) <= BREAD.halfLength * LENGTH_SLACK &&
    z >= -BREAD.halfDepth * 1.1 &&
    z <= BREAD.halfDepth * LENGTH_SLACK &&
    height >= MIN_HEIGHT &&
    height <= MAX_HEIGHT
  );
};

/** A flying piece is judged once it rested a bit after its first contact, or gave up. */
export const RESOLVE_AFTER_CONTACT_SECONDS = 1.1;
export const FORCE_RESOLVE_AFTER_CONTACT_SECONDS = 2.6;
/** Never touched anything (flew off into the dark): Sauerei after this long. */
export const LOST_AFTER_SECONDS = 4;

export type SlotVerdict = "pending" | "judge";

export const verdictFor = (
  sinceLaunch: number,
  sinceContact: number | null,
  resting: boolean,
): SlotVerdict => {
  if (sinceContact === null) {
    return sinceLaunch > LOST_AFTER_SECONDS ? "judge" : "pending";
  }
  if (sinceContact > FORCE_RESOLVE_AFTER_CONTACT_SECONDS) {
    return "judge";
  }
  return resting && sinceContact > RESOLVE_AFTER_CONTACT_SECONDS ? "judge" : "pending";
};
