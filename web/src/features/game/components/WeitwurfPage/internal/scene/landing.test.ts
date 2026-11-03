import { describe, expect, it } from "vitest";
import { BREAD, FLOOR_Y, PLATE_Y } from "@/components/DoenerStage/three";
import { isInBread, verdictFor } from "./landing";

describe("isInBread", () => {
  it("counts pieces in the gap and on the lid, not on the plate or the floor", () => {
    expect(isInBread(0, PLATE_Y + 0.35, 0.1)).toBe(true);
    expect(isInBread(BREAD.halfLength * 0.9, PLATE_Y + 0.8, -0.3)).toBe(true);
    expect(isInBread(0, PLATE_Y + 0.04, 0.1)).toBe(false);
    expect(isInBread(BREAD.halfLength + 0.4, PLATE_Y + 0.35, 0)).toBe(false);
    expect(isInBread(0, FLOOR_Y + 0.02, 2)).toBe(false);
  });
});

describe("verdictFor", () => {
  it("waits for a landed piece to rest, but not forever", () => {
    expect(verdictFor(0.5, 0.2, true)).toBe("pending");
    expect(verdictFor(2, 1.5, true)).toBe("judge");
    expect(verdictFor(2, 1.5, false)).toBe("pending");
    expect(verdictFor(4, 3, false)).toBe("judge");
  });

  it("gives up on a piece that never touched anything", () => {
    expect(verdictFor(3, null, false)).toBe("pending");
    expect(verdictFor(4.5, null, false)).toBe("judge");
  });
});
