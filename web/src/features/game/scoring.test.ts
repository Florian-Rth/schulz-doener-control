import { describe, expect, it } from "vitest";
import {
  aimFromFling,
  applyHit,
  applyMiss,
  comboMultiplier,
  INITIAL_TALLY,
  MAX_COMBO_MULTIPLIER,
  MAX_POINTS_PER_PIECE,
  PIECE_KINDS,
  PIECE_POINTS,
  pickPieceKind,
  pointsFor,
  roastTierFor,
} from "./scoring";

describe("comboMultiplier", () => {
  it("grows by 0.5 per hit in a row and caps at ×3", () => {
    expect(comboMultiplier(1)).toBe(1);
    expect(comboMultiplier(2)).toBe(1.5);
    expect(comboMultiplier(5)).toBe(3);
    expect(comboMultiplier(12)).toBe(MAX_COMBO_MULTIPLIER);
  });
});

describe("applyHit / applyMiss", () => {
  it("weighs pieces by type and multiplies consecutive hits", () => {
    const one = applyHit(INITIAL_TALLY, "fleisch");
    expect(one.score).toBe(30);
    const two = applyHit(one, "salat");
    // 10 × 1.5 for the second hit in a row.
    expect(two).toEqual({ score: 45, hits: 2, misses: 0, combo: 2, bestCombo: 2 });
  });

  it("counts a Sauerei and resets the combo, but keeps the best combo", () => {
    const hits = applyHit(applyHit(applyHit(INITIAL_TALLY, "tomate"), "tomate"), "tomate");
    const missed = applyMiss(hits);
    expect(missed.misses).toBe(1);
    expect(missed.combo).toBe(0);
    expect(missed.bestCombo).toBe(3);
    expect(missed.score).toBe(hits.score);
    expect(applyHit(missed, "gurke").score).toBe(hits.score + 20);
  });

  it("never exceeds the server's plausibility bound", () => {
    let tally = INITIAL_TALLY;
    for (let i = 0; i < 40; i += 1) {
      tally = applyHit(tally, "fleisch");
    }
    expect(tally.score).toBeLessThanOrEqual(
      tally.hits * MAX_POINTS_PER_PIECE * MAX_COMBO_MULTIPLIER,
    );
    expect(Math.max(...Object.values(PIECE_POINTS))).toBe(MAX_POINTS_PER_PIECE);
    expect(pointsFor("fleisch", 99)).toBe(90);
  });
});

describe("pickPieceKind", () => {
  it("covers every piece kind over the 0..1 range", () => {
    const seen = new Set(Array.from({ length: 100 }, (_, index) => pickPieceKind(index / 100)));
    expect([...seen].sort()).toEqual([...PIECE_KINDS].sort());
    expect(pickPieceKind(0.999_999)).toBe("fleisch");
  });
});

describe("aimFromFling", () => {
  it("ignores taps, sideways and downward swipes", () => {
    expect(aimFromFling({ dx: 0, dy: 0, durationMs: 80 })).toBeNull();
    expect(aimFromFling({ dx: 0.4, dy: -0.02, durationMs: 120 })).toBeNull();
    expect(aimFromFling({ dx: 0, dy: 0.3, durationMs: 120 })).toBeNull();
  });

  it("maps a straight swipe at the ideal speed onto the middle of the bread", () => {
    const aim = aimFromFling({ dx: 0, dy: -0.36, durationMs: 150 });
    expect(aim?.reach).toBeCloseTo(1);
    expect(aim?.lateral).toBe(0);
  });

  it("falls short when slow, overshoots when fast and drifts with the angle", () => {
    expect(aimFromFling({ dx: 0, dy: -0.2, durationMs: 400 })?.reach).toBeLessThan(0.5);
    expect(aimFromFling({ dx: 0, dy: -0.6, durationMs: 100 })?.reach).toBe(2);
    expect(aimFromFling({ dx: 0.2, dy: -0.4, durationMs: 150 })?.lateral).toBeCloseTo(0.8);
    expect(aimFromFling({ dx: -1, dy: -0.1, durationMs: 150 })?.lateral).toBe(-2);
  });
});

describe("roastTierFor", () => {
  it("roasts a messy round, praises a big score", () => {
    expect(roastTierFor(INITIAL_TALLY)).toBe("sauerei");
    expect(roastTierFor({ score: 60, hits: 2, misses: 9, combo: 0, bestCombo: 1 })).toBe("sauerei");
    expect(roastTierFor({ score: 300, hits: 10, misses: 4, combo: 0, bestCombo: 3 })).toBe(
      "solide",
    );
    expect(roastTierFor({ score: 800, hits: 18, misses: 2, combo: 6, bestCombo: 9 })).toBe(
      "meister",
    );
  });
});
