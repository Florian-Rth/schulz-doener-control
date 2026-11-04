import { describe, expect, it } from "vitest";
import { bordersPassed, restingRotation, sliceAngle, spinTarget } from "./wheel-geometry";

// The slice under the 12-o'clock pointer for a given rotation.
const sliceUnderPointer = (rotation: number, sliceCount: number): number => {
  const normalized = (((360 - rotation) % 360) + 360) % 360;
  return Math.floor(normalized / sliceAngle(sliceCount));
};

describe("wheel-geometry", () => {
  it("legt im Ruhezustand die Mitte des Zielsegments unter den Zeiger", () => {
    for (let index = 0; index < 5; index++) {
      expect(sliceUnderPointer(restingRotation(5, index), 5)).toBe(index);
    }
  });

  it("landet nach den vollen Umdrehungen auf dem Zielsegment, auch mit Zufalls-Versatz", () => {
    for (const jitter of [-1, 0, 1]) {
      const to = spinTarget(123, 7, 4, 6, jitter);
      expect(to).toBeGreaterThanOrEqual(123 + 5 * 360);
      expect(sliceUnderPointer(to, 7)).toBe(4);
    }
  });

  it("zählt eine Segmentgrenze mehr, sobald der Zeiger sie überquert", () => {
    expect(bordersPassed(89, 4)).toBe(0);
    expect(bordersPassed(91, 4)).toBe(1);
  });
});
