import { describe, expect, it } from "vitest";
import { verdictFor } from "./landing";

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
