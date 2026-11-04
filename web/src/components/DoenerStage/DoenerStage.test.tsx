import { ThemeProvider } from "@mui/material/styles";
import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { theme } from "@/styles/theme";
import { EMPTY_BUILD } from "./build";
import { DoenerStage } from "./DoenerStage";
import { buildAtBeat, useBuildReplay } from "./use-build-replay";

// jsdom has no WebGL — the probe shows what would be in the bread.
vi.mock("./internal/scene/DoenerScene", () => ({
  DoenerScene: ({
    build,
    meatKeys,
    children,
  }: {
    build: { meat: string | null; veggies: string[]; sauces: string[] };
    meatKeys: string[];
    children?: React.ReactNode;
  }) => (
    <div data-testid="scene" data-meat-keys={meatKeys.join(",")}>
      {[build.meat ?? "", ...build.veggies, ...build.sauces].join("|")}
      {children}
    </div>
  ),
}));

const Themed = ({ children }: { children: ReactNode }) => (
  <ThemeProvider theme={theme}>{children}</ThemeProvider>
);

describe("DoenerStage", () => {
  it("renders the build, extra scene content and the overlay", async () => {
    const { rerender } = render(
      <DoenerStage build={EMPTY_BUILD} overlay={<span>Punkte: 3</span>}>
        <span>Maskottchen</span>
      </DoenerStage>,
      { wrapper: Themed },
    );
    expect(await screen.findByTestId("scene")).toHaveTextContent("Maskottchen");
    expect(screen.getByText("Punkte: 3")).toBeInTheDocument();

    rerender(<DoenerStage build={{ meat: "pute", veggies: ["salat"], sauces: [] }} />);
    expect(screen.getByTestId("scene")).toHaveTextContent("pute|salat");
    // Unknown meats are pre-mounted next to the known ones.
    expect(screen.getByTestId("scene").dataset.meatKeys).toContain("pute");
  });
});

describe("buildAtBeat", () => {
  const target = { meat: "kalb", veggies: ["salat", "tomate"] as const, sauces: ["scharf"] };

  it("adds meat, then each veggie, then each sauce", () => {
    const full = { ...target, veggies: [...target.veggies] };
    expect(buildAtBeat(full, 1)).toEqual({ meat: "kalb", veggies: [], sauces: [] });
    expect(buildAtBeat(full, 3)).toEqual({
      meat: "kalb",
      veggies: ["salat", "tomate"],
      sauces: [],
    });
    expect(buildAtBeat(full, 4)).toEqual(full);
  });
});

const ReplayProbe = ({ meat }: { meat: string }) => {
  const { build, done } = useBuildReplay(
    { meat, veggies: ["salat"], sauces: [] },
    { beatMs: 100, startDelayMs: 100 },
  );
  return <span>{`${build.meat ?? "-"}|${build.veggies.join(",")}|${String(done)}`}</span>;
};

describe("useBuildReplay", () => {
  it("replays the build beat by beat and restarts for another Döner", () => {
    vi.useFakeTimers();
    const { rerender } = render(<ReplayProbe meat="kalb" />);
    expect(screen.getByText("-||false")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.getByText("kalb||false")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(screen.getByText("kalb|salat|true")).toBeInTheDocument();

    rerender(<ReplayProbe meat="haehnchen" />);
    expect(screen.getByText("-||false")).toBeInTheDocument();
    vi.useRealTimers();
  });
});
