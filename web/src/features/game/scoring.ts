// The pure rules of the Döner-Weitwurf: what a piece is worth, how combos
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

// Heavy and rare is worth more; flimsy lettuce flutters in easily.
export const PIECE_POINTS: Record<PieceKind, number> = {
  fleisch: 30,
  zwiebel: 25,
  tomate: 20,
  gurke: 20,
  rotkohl: 15,
  salat: 10,
};

export const MAX_POINTS_PER_PIECE = 30;
export const MAX_COMBO_MULTIPLIER = 3;

/** ×1 for a single hit, +0.5 per hit in a row, capped at ×3 (5 in a row). */
export const comboMultiplier = (combo: number): number =>
  Math.min(MAX_COMBO_MULTIPLIER, 1 + Math.max(0, combo - 1) * 0.5);

export interface GameTally {
  score: number;
  hits: number;
  /** Pieces that ended up on the floor or the plate: the "Sauerei". */
  misses: number;
  /** Hits in a row right now. */
  combo: number;
  bestCombo: number;
}

export const INITIAL_TALLY: GameTally = { score: 0, hits: 0, misses: 0, combo: 0, bestCombo: 0 };

/** Points a hit of `kind` is worth with `combo` hits in a row (this one included). */
export const pointsFor = (kind: PieceKind, combo: number): number =>
  Math.round(PIECE_POINTS[kind] * comboMultiplier(combo));

export const applyHit = (tally: GameTally, kind: PieceKind): GameTally => {
  const combo = tally.combo + 1;
  return {
    score: tally.score + pointsFor(kind, combo),
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

/** A swipe on the canvas, in fractions of the canvas height (y grows downwards). */
export interface Fling {
  dx: number;
  dy: number;
  durationMs: number;
}

/**
 * Where a throw goes, relative to a perfect one. `reach` 1 lands in the middle
 * of the bread; less falls short, more overshoots. `lateral` is the sideways
 * offset in bread half-lengths (±1 = the ends of the bread).
 */
export interface ThrowAim {
  reach: number;
  lateral: number;
}

/** Swipe speed (canvas heights per second) that throws exactly into the bread. */
export const IDEAL_FLING_SPEED = 2.4;
const MIN_FLING_UP = 0.05;
const MIN_FLING_MS = 40;

/** Null when the gesture was not an upward fling (a tap, a sideways or downward swipe). */
export const aimFromFling = ({ dx, dy, durationMs }: Fling): ThrowAim | null => {
  if (-dy < MIN_FLING_UP) {
    return null;
  }
  const seconds = Math.max(MIN_FLING_MS, durationMs) / 1000;
  const speed = Math.hypot(dx, dy) / seconds;
  return {
    reach: Math.min(2, Math.max(0.35, speed / IDEAL_FLING_SPEED)),
    // The swipe angle: 45° to the side puts it far past the end of the bread.
    lateral: Math.max(-2, Math.min(2, (dx / -dy) * 1.6)),
  };
};

export type RoastTier = "sauerei" | "solide" | "meister";

/** Which roast pool the end screen draws from. */
export const roastTierFor = (tally: GameTally): RoastTier => {
  if (tally.hits === 0 || tally.misses > tally.hits * 2) {
    return "sauerei";
  }
  return tally.score >= 600 ? "meister" : "solide";
};
