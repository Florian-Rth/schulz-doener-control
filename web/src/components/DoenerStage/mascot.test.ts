import { describe, expect, it } from "vitest";
import { fitText, isKnockedOver, mascotCopy, mascotPlacement, splitTierName } from "./mascot";

// A monospace stand-in for canvas measureText: every character is 0.6em wide.
const monospace = (text: string, fontSize: number): number => text.length * fontSize * 0.6;

describe("splitTierName", () => {
  it("prints the article small above the title", () => {
    expect(splitTierName("Der Knoblauch-Wolf")).toEqual({
      article: "Der",
      title: "Knoblauch-Wolf",
    });
    expect(splitTierName("Das Gewohnheits-Faultier")).toEqual({
      article: "Das",
      title: "Gewohnheits-Faultier",
    });
    expect(splitTierName("  Der solide Döner-Bürger ")).toEqual({
      article: "Der",
      title: "solide Döner-Bürger",
    });
  });

  it("keeps names without an article (or only an article) whole", () => {
    expect(splitTierName("Packesel")).toEqual({ article: null, title: "Packesel" });
    expect(splitTierName("Der")).toEqual({ article: null, title: "Der" });
  });
});

describe("fitText", () => {
  it("keeps a short title on one line at full size", () => {
    expect(fitText("Packesel", monospace, 400, 58, 26)).toEqual({
      lines: ["Packesel"],
      fontSize: 58,
    });
  });

  it("shrinks before it breaks, then breaks at a hyphen", () => {
    // 20 chars: one line fits up to 33px, but two lines come in at 42px already.
    const fitted = fitText("Gewohnheits-Faultier", monospace, 400, 58, 26);
    expect(fitted.lines).toEqual(["Gewohnheits-", "Faultier"]);
    expect(fitted.fontSize).toBeLessThanOrEqual(58 * 0.75);
    for (const line of fitted.lines) {
      expect(monospace(line, fitted.fontSize)).toBeLessThanOrEqual(400);
    }
  });

  it("breaks at the space closest to the middle", () => {
    expect(fitText("solide Döner-Bürger", monospace, 300, 58, 26).lines).toEqual([
      "solide Döner-",
      "Bürger",
    ]);
    expect(fitText("NICHT INS GESICHT!", monospace, 300, 92, 34).lines).toEqual([
      "NICHT INS",
      "GESICHT!",
    ]);
  });

  it("falls back to the minimum size when nothing fits", () => {
    expect(fitText("Donaudampfschifffahrt", monospace, 100, 58, 26)).toEqual({
      lines: ["Donaudampfschifffahrt"],
      fontSize: 26,
    });
  });
});

describe("mascotPlacement", () => {
  it("stands beside the end of the Döner, on the plate, facing the front", () => {
    const right = mascotPlacement("right");
    const left = mascotPlacement("left");
    expect(right.x).toBeGreaterThan(1.55);
    expect(left.x).toBe(-right.x);
    expect(Math.hypot(right.x, right.z)).toBeLessThan(2.2 - 0.25);
    // Turned towards the middle: the right one looks left (negative yaw).
    expect(right.yaw).toBeLessThan(0);
    expect(left.yaw).toBeCloseTo(-right.yaw);
  });

  it("takes an explicit spot over the side", () => {
    expect(mascotPlacement("right", [-0.5, 1])).toMatchObject({ x: -0.5, z: 1 });
    expect(mascotPlacement("left", [0, 1]).yaw).toBeCloseTo(0);
  });
});

describe("isKnockedOver", () => {
  const tilted = (angle: number): { x: number; y: number; z: number; w: number } => ({
    x: Math.sin(angle / 2),
    y: 0,
    z: 0,
    w: Math.cos(angle / 2),
  });

  it("tells wobbling from lying", () => {
    expect(isKnockedOver({ x: 0, y: 0, z: 0, w: 1 })).toBe(false);
    expect(isKnockedOver(tilted(0.5))).toBe(false);
    expect(isKnockedOver(tilted(Math.PI / 2))).toBe(true);
    expect(isKnockedOver(tilted(Math.PI))).toBe(true);
  });

  it("ignores turning around the up axis", () => {
    expect(isKnockedOver({ x: 0, y: Math.sin(1), z: 0, w: Math.cos(1) })).toBe(false);
  });
});

describe("mascotCopy", () => {
  it("has a line for every mood, all shouted", () => {
    for (const pool of [mascotCopy.ouch, mascotCopy.down, mascotCopy.up]) {
      expect(pool.length).toBeGreaterThan(2);
      for (const line of pool) {
        expect(line).toBe(line.toUpperCase());
      }
    }
  });
});
