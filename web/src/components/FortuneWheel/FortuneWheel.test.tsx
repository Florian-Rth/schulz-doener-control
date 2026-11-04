import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithTheme } from "@/test/renderWithTheme";
import { FortuneWheel } from "./FortuneWheel";

describe("FortuneWheel", () => {
  it("beschriftet jedes Segment und ist als Bild benannt", () => {
    renderWithTheme(
      <FortuneWheel
        slices={[
          { label: "Lukas", color: "#00728E" },
          { label: "Sara", color: "#ED701C" },
        ]}
        rotation={0}
        highlightIndex={null}
        ariaLabel="Abholer-Glücksrad"
      />,
    );

    expect(screen.getByRole("img", { name: "Abholer-Glücksrad" })).toBeInTheDocument();
    expect(screen.getByText("Lukas")).toBeInTheDocument();
    expect(screen.getByText("Sara")).toBeInTheDocument();
  });

  it("kürzt lange Namen, damit sie ins Segment passen", () => {
    renderWithTheme(
      <FortuneWheel
        slices={[{ label: "Maximilianus", color: "#00728E" }]}
        rotation={0}
        highlightIndex={0}
        ariaLabel="Abholer-Glücksrad"
      />,
    );

    expect(screen.getByText("Maximilia…")).toBeInTheDocument();
  });
});
