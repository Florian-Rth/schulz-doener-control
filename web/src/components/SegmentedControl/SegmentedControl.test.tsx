import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/renderWithTheme";
import { SegmentedControl } from "./SegmentedControl";

const MEAT_OPTIONS = [
  { value: "Kalb", label: "Kalb" },
  { value: "Haehnchen", label: "Hähnchen" },
] as const;

describe("SegmentedControl", () => {
  it("ruft onChange mit der gewählten Option auf", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    renderWithTheme(<SegmentedControl options={MEAT_OPTIONS} value="Kalb" onChange={onChange} />);

    await user.click(screen.getByRole("button", { name: "Hähnchen" }));
    expect(onChange).toHaveBeenCalledWith("Haehnchen");
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("markiert immer genau eine Option als aktiv (single-select)", async () => {
    const Harness = () => {
      const [value, setValue] = useState<string>("Kalb");
      return <SegmentedControl options={MEAT_OPTIONS} value={value} onChange={setValue} />;
    };
    const user = userEvent.setup();
    renderWithTheme(<Harness />);

    expect(screen.getByRole("button", { name: "Kalb" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Hähnchen" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    await user.click(screen.getByRole("button", { name: "Hähnchen" }));

    expect(screen.getByRole("button", { name: "Kalb" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "Hähnchen" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
