import { describe, expect, it } from "vitest";
import { konfiguratorCopy } from "./copy";
import { pickLine, rollSeed } from "./funny-lines";

describe("pickLine", () => {
  it("is stable for the same seed", () => {
    expect(pickLine(konfiguratorCopy.yes, 42)).toBe(pickLine(konfiguratorCopy.yes, 42));
  });

  it("always returns a line from the pool", () => {
    for (let seed = 0; seed < 50; seed += 1) {
      expect(konfiguratorCopy.no).toContain(pickLine(konfiguratorCopy.no, seed));
    }
  });

  it("spreads across the whole pool", () => {
    const seen = new Set(
      Array.from({ length: 40 }, (_, seed) => pickLine(konfiguratorCopy.yes, seed)),
    );
    expect(seen.size).toBe(konfiguratorCopy.yes.length);
  });
});

describe("rollSeed", () => {
  it("rolls a non-negative integer", () => {
    const seed = rollSeed();
    expect(Number.isInteger(seed)).toBe(true);
    expect(seed).toBeGreaterThanOrEqual(0);
  });
});
