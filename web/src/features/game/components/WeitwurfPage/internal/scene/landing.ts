// When a thrown piece is judged. Where it lies then decides the bucket
// (`bucketAt` in scoring.ts).

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
