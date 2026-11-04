import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useFunnyLine } from "./use-funny-line";

const POOL = ["Rein damit!", "Volle Kanne!", "Feuer frei!", "Her damit!"] as const;

describe("useFunnyLine", () => {
  it("returns a line from the pool", () => {
    const { result } = renderHook(() => useFunnyLine(POOL));
    expect(POOL).toContain(result.current);
  });

  it("keeps the same line across re-renders", () => {
    const { result, rerender } = renderHook(() => useFunnyLine(POOL));
    const first = result.current;
    for (let render = 0; render < 10; render += 1) {
      rerender();
      expect(result.current).toBe(first);
    }
  });
});
