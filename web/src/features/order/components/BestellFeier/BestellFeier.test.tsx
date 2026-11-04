import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/renderWithTheme";
import { bestellFeierCopy } from "../../copy";
import { FEIER_DURATION_MS, FEIER_REDUCED_DURATION_MS } from "../../hooks/use-bestell-feier";
import { BestellFeier } from "./BestellFeier";

// jsdom has no WebGL — replace the three.js stage with a probe.
vi.mock("@/components/DoenerStage/internal/scene/DoenerScene", () => ({
  DoenerScene: ({
    build,
    presenting,
  }: {
    build: { meat: string | null; veggies: string[]; sauces: string[] };
    presenting: boolean;
  }) => (
    <div data-testid="doener-scene" data-presenting={String(presenting)}>
      {[build.meat ?? "", ...build.veggies, ...build.sauces].join("|")}
    </div>
  ),
}));

const doener = {
  build: { meat: "kalb", veggies: ["salat" as const], sauces: ["knoblauch"] },
  icon: "kebab_dining",
};
const pizza = { build: null, icon: "local_pizza" };

const isFeierLine = (text: string): boolean =>
  (bestellFeierCopy.lines as readonly string[]).includes(text);

const stubReducedMotion = (reduce: boolean): void => {
  vi.stubGlobal(
    "matchMedia",
    (query: string): Pick<MediaQueryList, "matches" | "media"> => ({
      matches: reduce && query.includes("reduce"),
      media: query,
    }),
  );
};

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("BestellFeier", () => {
  it("lässt den eigenen Döner auf dem Drehteller kreisen und zeigt eine Zeile aus dem Pool", async () => {
    renderWithTheme(<BestellFeier celebration={doener} onDone={vi.fn()} />);

    const line = screen.getByRole("heading").textContent ?? "";
    expect(isFeierLine(line)).toBe(true);
    expect(screen.getByRole("dialog")).toHaveAccessibleName(line);
    expect(await screen.findByTestId("doener-scene")).toHaveAttribute("data-presenting", "true");
    expect(screen.queryByTestId("konfetti")).not.toBeInTheDocument();
  });

  it("baut den bestellten Döner im Zeitraffer wieder zusammen, bevor es weitergeht", async () => {
    vi.useFakeTimers();
    const onDone = vi.fn();
    renderWithTheme(<BestellFeier celebration={doener} onDone={onDone} />);

    // One beat per act, so React commits and schedules the next ingredient.
    for (let beat = 0; beat < 6; beat += 1) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(300);
      });
    }

    expect(screen.getByTestId("doener-scene")).toHaveTextContent("kalb|salat|knoblauch");
    expect(onDone).not.toHaveBeenCalled();
  });

  it("feiert eine Pizza ohne 3D mit Konfetti", () => {
    renderWithTheme(<BestellFeier celebration={pizza} onDone={vi.fn()} />);

    expect(screen.queryByTestId("doener-scene")).not.toBeInTheDocument();
    expect(screen.getAllByTestId("konfetti").length).toBeGreaterThan(0);
  });

  it("geht mit 'Weiter' genau einmal weiter, obwohl der Klick auch die Fläche trifft", () => {
    const onDone = vi.fn();
    renderWithTheme(<BestellFeier celebration={pizza} onDone={onDone} />);

    fireEvent.click(screen.getByRole("button", { name: bestellFeierCopy.next }));

    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("lässt sich per Tipp irgendwo überspringen", () => {
    const onDone = vi.fn();
    renderWithTheme(<BestellFeier celebration={pizza} onDone={onDone} />);

    fireEvent.click(screen.getByText(bestellFeierCopy.skipHint));

    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("geht nach rund 4 s von selbst weiter", () => {
    vi.useFakeTimers();
    const onDone = vi.fn();
    renderWithTheme(<BestellFeier celebration={doener} onDone={onDone} />);

    act(() => {
      vi.advanceTimersByTime(FEIER_DURATION_MS - 100);
    });
    expect(onDone).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("zeigt bei reduzierter Bewegung nur eine kurze statische Karte", () => {
    stubReducedMotion(true);
    vi.useFakeTimers();
    const onDone = vi.fn();
    renderWithTheme(<BestellFeier celebration={doener} onDone={onDone} />);

    expect(screen.queryByTestId("doener-scene")).not.toBeInTheDocument();
    expect(screen.queryByTestId("konfetti")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(FEIER_REDUCED_DURATION_MS);
    });
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
