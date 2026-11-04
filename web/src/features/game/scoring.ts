// The pure rules of the Döner-Weitwurf: which bucket is worth what, how combos
// multiply, and how a fling on the screen turns into a throw. No React, no
// three.js, so all of it is unit-testable. The server re-checks the bounds
// (server/…/GameScoreRules.cs): keep MAX_POINTS_PER_PIECE and
// MAX_COMBO_MULTIPLIER in sync with it.

export const ROUND_SECONDS = 30;
/** After the whistle, pieces still in the air get this long to land. */
export const OVERTIME_SECONDS = 2;
/** Minimum time between two throws: no machine-gun spam. */
export const THROW_COOLDOWN_MS = 280;

export type PieceKind = "fleisch" | "tomate" | "gurke" | "zwiebel" | "salat" | "rotkohl";

export const PIECE_KINDS: readonly PieceKind[] = [
  "fleisch",
  "tomate",
  "gurke",
  "zwiebel",
  "salat",
  "rotkohl",
];

export type BucketId = "bambini" | "stammkunde" | "meister";

export interface Bucket {
  id: BucketId;
  /** What a piece that stays in this bucket is worth, before the combo. */
  points: number;
  /** Floor position (x sideways, z towards the thrower) and size, in scene units. */
  x: number;
  z: number;
  radius: number;
  height: number;
}

// Near and wide is easy, far and narrow is the jackpot. The thrower stands
// behind z ≈ 4.5, so depth is the difficulty.
export const BUCKETS: readonly Bucket[] = [
  { id: "bambini", points: 10, x: -0.7, z: 1.5, radius: 0.8, height: 0.5 },
  { id: "stammkunde", points: 25, x: 0.75, z: -0.9, radius: 0.65, height: 0.55 },
  { id: "meister", points: 50, x: -0.25, z: -3.6, radius: 0.55, height: 0.6 },
];

export const MAX_POINTS_PER_PIECE = Math.max(...BUCKETS.map((bucket) => bucket.points));
export const MAX_COMBO_MULTIPLIER = 3;

/** ×1 for a single hit, +0.5 per hit in a row, capped at ×3 (5 in a row). */
export const comboMultiplier = (combo: number): number =>
  Math.min(MAX_COMBO_MULTIPLIER, 1 + Math.max(0, combo - 1) * 0.5);

export interface GameTally {
  score: number;
  hits: number;
  /** Pieces that ended up on the floor: the "Sauerei". */
  misses: number;
  /** Hits in a row right now. */
  combo: number;
  bestCombo: number;
}

export const INITIAL_TALLY: GameTally = { score: 0, hits: 0, misses: 0, combo: 0, bestCombo: 0 };

/** Points a hit in `bucket` is worth with `combo` hits in a row (this one included). */
export const pointsFor = (bucket: Bucket, combo: number): number =>
  Math.round(bucket.points * comboMultiplier(combo));

export const applyHit = (tally: GameTally, bucket: Bucket): GameTally => {
  const combo = tally.combo + 1;
  return {
    score: tally.score + pointsFor(bucket, combo),
    hits: tally.hits + 1,
    misses: tally.misses,
    combo,
    bestCombo: Math.max(tally.bestCombo, combo),
  };
};

export const applyMiss = (tally: GameTally): GameTally => ({
  ...tally,
  misses: tally.misses + 1,
  combo: 0,
});

/** The bucket a resting piece lies in, or null for a Sauerei. */
export const bucketAt = (x: number, height: number, z: number): Bucket | null =>
  BUCKETS.find(
    (bucket) =>
      Math.hypot(x - bucket.x, z - bucket.z) < bucket.radius &&
      height >= -0.05 &&
      height <= bucket.height + 0.08,
  ) ?? null;

/** Picks the next piece from a 0..1 random number. Lettuce is common, meat a bit rarer. */
const KIND_WEIGHTS: readonly (readonly [PieceKind, number])[] = [
  ["salat", 3],
  ["tomate", 3],
  ["gurke", 2],
  ["zwiebel", 2],
  ["rotkohl", 2],
  ["fleisch", 3],
];
const TOTAL_WEIGHT = KIND_WEIGHTS.reduce((sum, [, weight]) => sum + weight, 0);

export const pickPieceKind = (random: number): PieceKind => {
  let left = random * TOTAL_WEIGHT;
  for (const [kind, weight] of KIND_WEIGHTS) {
    left -= weight;
    if (left < 0) {
      return kind;
    }
  }
  return "fleisch";
};

/**
 * The end of a swipe on the canvas — its last ~100 ms, so the release speed
 * counts, not a slow start. In fractions of the canvas height (y grows downwards).
 */
export interface Fling {
  dx: number;
  dy: number;
  durationMs: number;
}

/**
 * A throw as the player meant it. `power` 1 is a swipe at the ideal speed;
 * slower throws shorter, faster further. `dx`/`dy` is the swipe direction on
 * the screen (unit length) — the piece flies towards what the swipe points at.
 */
export interface ThrowAim {
  power: number;
  dx: number;
  dy: number;
}

/** Swipe speed (canvas heights per second) for a power-1 throw. */
export const IDEAL_FLING_SPEED = 2.4;
export const MIN_POWER = 0.3;
export const MAX_POWER = 2.6;
const MIN_FLING_UP = 0.05;
const MIN_FLING_MS = 40;

/** Null when the gesture was not an upward fling (a tap, a sideways or downward swipe). */
export const aimFromFling = ({ dx, dy, durationMs }: Fling): ThrowAim | null => {
  if (-dy < MIN_FLING_UP) {
    return null;
  }
  const length = Math.hypot(dx, dy);
  const seconds = Math.max(MIN_FLING_MS, durationMs) / 1000;
  return {
    power: Math.min(MAX_POWER, Math.max(MIN_POWER, length / seconds / IDEAL_FLING_SPEED)),
    dx: dx / length,
    dy: dy / length,
  };
};

/** Ground distance of a throw: power 1 reaches the middle bucket. */
export const IDEAL_THROW_DISTANCE = 5.6;
// Distance grows slower than the swipe speed: a finger is not that precise,
// so 10 % too fast is ~7 % too far, not 10 %.
const DISTANCE_EXPONENT = 0.7;
export const throwDistance = (power: number): number =>
  IDEAL_THROW_DISTANCE * power ** DISTANCE_EXPONENT;
/** The power that throws exactly `distance` far. */
export const powerForDistance = (distance: number): number =>
  (distance / IDEAL_THROW_DISTANCE) ** (1 / DISTANCE_EXPONENT);

export type RoastTier = "sauerei" | "solide" | "meister";

/** Which roast pool the end screen draws from. */
export const roastTierFor = (tally: GameTally): RoastTier => {
  if (tally.hits === 0 || tally.misses > tally.hits * 2) {
    return "sauerei";
  }
  return tally.score >= 900 ? "meister" : "solide";
};
