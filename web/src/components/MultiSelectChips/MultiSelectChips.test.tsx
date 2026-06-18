import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithTheme } from "@/test/renderWithTheme";
import { MultiSelectChips } from "./MultiSelectChips";

const SAUCE_OPTIONS = [
  { value: "Kraeuter", label: "Kräuter", emoji: "🌿" },
  { value: "Knoblauch", label: "Knoblauch", emoji: "🧄" },
  { value: "Scharf", label: "Scharf", emoji: "🌶️" },
] as const;

describe("MultiSelectChips", () => {
  it("ruft onToggle mit dem angeklickten Wert auf", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    renderWithTheme(<MultiSelectChips options={SAUCE_OPTIONS} value={[]} onToggle={onToggle} />);

    await user.click(screen.getByRole("button", { name: /Knoblauch/ }));
    expect(onToggle).toHaveBeenCalledWith("Knoblauch");
  });

  it("erlaubt mehrere gleichzeitig aktive Auswahlen", async () => {
    const Harness = () => {
      const [value, setValue] = useState<string[]>([]);
      const onToggle = (v: string) => {
        setValue((prev) => (prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]));
      };
      return <MultiSelectChips options={SAUCE_OPTIONS} value={value} onToggle={onToggle} />;
    };
    const user = userEvent.setup();
    renderWithTheme(<Harness />);

    const knobi = screen.getByRole("button", { name: /Knoblauch/ });
    const scharf = screen.getByRole("button", { name: /Scharf/ });

    expect(knobi).toHaveAttribute("aria-pressed", "false");
    expect(scharf).toHaveAttribute("aria-pressed", "false");

    await user.click(knobi);
    await user.click(scharf);

    // Both stay active simultaneously — this is the multi-select behaviour.
    expect(knobi).toHaveAttribute("aria-pressed", "true");
    expect(scharf).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Kräuter/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    // Toggling an active chip clears it again.
    await user.click(knobi);
    expect(knobi).toHaveAttribute("aria-pressed", "false");
    expect(scharf).toHaveAttribute("aria-pressed", "true");
  });
});
