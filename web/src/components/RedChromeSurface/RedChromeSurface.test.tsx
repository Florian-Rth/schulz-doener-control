import { describe, expect, it } from "vitest";
import { renderWithTheme } from "@/test/renderWithTheme";
import { RedChromeSurface } from "./RedChromeSurface";

describe("RedChromeSurface", () => {
  it("rendert die Bevel-Overlay (Schräge) und die Slot-Inhalte", () => {
    const { getByTestId, getByText } = renderWithTheme(
      <RedChromeSurface start={<span>start-slot</span>} end={<span>end-slot</span>}>
        <span>titel-block</span>
      </RedChromeSurface>,
    );

    const bevel = getByTestId("schraege");
    expect(bevel).toBeInTheDocument();
    // The bevel is the clip-path overlay — it must carry a clip-path.
    expect(bevel).toHaveStyle({ clipPath: "polygon(82% 0,100% 0,100% 100%,75% 100%)" });

    expect(getByText("start-slot")).toBeInTheDocument();
    expect(getByText("titel-block")).toBeInTheDocument();
    expect(getByText("end-slot")).toBeInTheDocument();
  });

  it("rendert die tiefe Variante der Schräge", () => {
    const { getByTestId } = renderWithTheme(
      <RedChromeSurface clipVariant="deep">
        <span>x</span>
      </RedChromeSurface>,
    );

    expect(getByTestId("schraege")).toHaveStyle({
      clipPath: "polygon(78% 0,100% 0,100% 100%,62% 100%)",
    });
  });
});
