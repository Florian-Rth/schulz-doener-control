import { describe, expect, it } from "vitest";
import { pickLine, rollSeed } from "./funny-lines";

const YES = ["Rein damit!", "Volle Kanne!", "Feuer frei!", "Her damit!", "Logo, Chef!"] as const;
const NO = ["Nö.", "Bloß nicht", "Pass ich"] as const;

describe("pickLine", () => {
  it("is stable for the same seed", () => {
    expect(pickLine(YES, 42)).toBe(pickLine(YES, 42));
  });

  it("always returns a line from the pool", () => {
    for (let seed = 0; seed < 50; seed += 1) {
      expect(NO).toContain(pickLine(NO, seed));
    }
  });

  it("spreads across the whole pool", () => {
    const seen = new Set(Array.from({ length: 40 }, (_, seed) => pickLine(YES, seed)));
    expect(seen.size).toBe(YES.length);
  });
});

describe("rollSeed", () => {
  it("rolls a non-negative integer", () => {
    const seed = rollSeed();
    expect(Number.isInteger(seed)).toBe(true);
    expect(seed).toBeGreaterThanOrEqual(0);
  });
});
