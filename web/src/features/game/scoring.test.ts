import { describe, expect, it } from "vitest";
import {
  aimFromFling,
  applyHit,
  applyMiss,
  BUCKETS,
  type Bucket,
  bucketAt,
  comboMultiplier,
  IDEAL_THROW_DISTANCE,
  INITIAL_TALLY,
  MAX_COMBO_MULTIPLIER,
  MAX_POINTS_PER_PIECE,
  MAX_POWER,
  PIECE_KINDS,
  pickPieceKind,
  pointsFor,
  powerForDistance,
  roastTierFor,
  throwDistance,
} from "./scoring";

const bucket = (id: Bucket["id"]): Bucket => {
  const found = BUCKETS.find((candidate) => candidate.id === id);
  if (found === undefined) {
    throw new Error(`no bucket ${id}`);
  }
  return found;
};

describe("comboMultiplier", () => {
  it("grows by 0.5 per hit in a row and caps at ×3", () => {
    expect(comboMultiplier(0)).toBe(1);
    expect(comboMultiplier(1)).toBe(1);
    expect(comboMultiplier(2)).toBe(1.5);
    expect(comboMultiplier(5)).toBe(3);
    expect(comboMultiplier(12)).toBe(MAX_COMBO_MULTIPLIER);
  });
});

describe("buckets", () => {
  it("pay more the further away and narrower they are", () => {
    const [near, middle, far] = ["bambini", "stammkunde", "meister"].map((id) =>
      bucket(id as Bucket["id"]),
    );
    expect(near?.points).toBeLessThan(middle?.points ?? 0);
    expect(middle?.points).toBeLessThan(far?.points ?? 0);
    expect(near?.z).toBeGreaterThan(middle?.z ?? 0);
    expect(middle?.z).toBeGreaterThan(far?.z ?? 0);
    expect(near?.radius).toBeGreaterThan(far?.radius ?? 0);
  });

  it("finds the bucket a resting piece lies in, and nothing next to it", () => {
    const far = bucket("meister");
    expect(bucketAt(far.x, 0.1, far.z)).toBe(far);
    expect(bucketAt(far.x + far.radius * 0.8, 0.3, far.z)).toBe(far);
    expect(bucketAt(far.x + far.radius + 0.1, 0.05, far.z)).toBeNull();
    // Lying on top of the rim does not count: it has to be inside.
    expect(bucketAt(far.x, far.height + 0.4, far.z)).toBeNull();
    expect(bucketAt(0, 0.05, 6)).toBeNull();
  });
});

describe("applyHit / applyMiss", () => {
  it("scores by bucket and multiplies consecutive hits", () => {
    const one = applyHit(INITIAL_TALLY, bucket("stammkunde"));
    expect(one).toEqual({ score: 25, hits: 1, misses: 0, combo: 1, bestCombo: 1 });
    const two = applyHit(one, bucket("meister"));
    expect(two.score).toBe(25 + 75);
    expect(two.combo).toBe(2);
  });

  it("counts a Sauerei and resets the combo, but keeps the best combo", () => {
    const near = bucket("bambini");
    const hits = applyHit(applyHit(applyHit(INITIAL_TALLY, near), near), near);
    const missed = applyMiss(hits);
    expect(missed.misses).toBe(1);
    expect(missed.combo).toBe(0);
    expect(missed.bestCombo).toBe(3);
    expect(applyHit(missed, near).score).toBe(hits.score + 10);
  });

  it("never exceeds the server's plausibility bound", () => {
    let tally = INITIAL_TALLY;
    for (let i = 0; i < 40; i += 1) {
      tally = applyHit(tally, bucket("meister"));
    }
    expect(tally.score).toBeLessThanOrEqual(
      tally.hits * MAX_POINTS_PER_PIECE * MAX_COMBO_MULTIPLIER,
    );
    expect(MAX_POINTS_PER_PIECE).toBe(50);
    expect(pointsFor(bucket("meister"), 99)).toBe(150);
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

  it("turns the swipe speed into power and keeps its direction", () => {
    const ideal = aimFromFling({ dx: 0, dy: -0.36, durationMs: 150 });
    expect(ideal?.power).toBeCloseTo(1);
    expect(ideal?.dx).toBe(0);
    expect(ideal?.dy).toBe(-1);
    expect(aimFromFling({ dx: 0, dy: -0.2, durationMs: 400 })?.power).toBeLessThan(0.5);
    expect(aimFromFling({ dx: 0, dy: -0.9, durationMs: 100 })?.power).toBe(MAX_POWER);
    const diagonal = aimFromFling({ dx: 0.3, dy: -0.4, durationMs: 150 });
    expect(diagonal?.dx).toBeCloseTo(0.6);
    expect(diagonal?.dy).toBeCloseTo(-0.8);
  });

  it("throws further with more power, but forgives a sloppy finger", () => {
    expect(throwDistance(1)).toBe(IDEAL_THROW_DISTANCE);
    expect(throwDistance(MAX_POWER)).toBeGreaterThan(Math.abs(bucket("meister").z) + 6);
    expect(throwDistance(1.1) / throwDistance(1)).toBeLessThan(1.08);
    expect(powerForDistance(throwDistance(1.7))).toBeCloseTo(1.7);
  });
});

describe("roastTierFor", () => {
  it("roasts a messy round, praises a big score", () => {
    expect(roastTierFor(INITIAL_TALLY)).toBe("sauerei");
    expect(roastTierFor({ score: 60, hits: 2, misses: 9, combo: 0, bestCombo: 1 })).toBe("sauerei");
    expect(roastTierFor({ score: 300, hits: 10, misses: 4, combo: 0, bestCombo: 3 })).toBe(
      "solide",
    );
    expect(roastTierFor({ score: 1000, hits: 18, misses: 2, combo: 6, bestCombo: 9 })).toBe(
      "meister",
    );
  });
});
