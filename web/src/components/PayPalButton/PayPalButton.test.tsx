import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithTheme } from "@/test/renderWithTheme";
import { PayPalButton } from "./PayPalButton";

describe("PayPalButton", () => {
  it("verlinkt auf die PayPal.Me-URL und öffnet einen neuen Tab", () => {
    renderWithTheme(
      <PayPalButton href="https://paypal.me/LukasBrandtHB/8.00EUR">
        Jetzt 8,00 € per PayPal senden
      </PayPalButton>,
    );

    const link = screen.getByRole("link", { name: /Jetzt 8,00 € per PayPal senden/ });
    expect(link).toHaveAttribute("href", "https://paypal.me/LukasBrandtHB/8.00EUR");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("ist deaktiviert und ohne href, wenn kein Handle vorliegt", () => {
    renderWithTheme(<PayPalButton href={null}>PayPal</PayPalButton>);

    // A disabled MUI button without href renders as a <button>, not a link.
    const button = screen.getByRole("button", { name: "PayPal" });
    expect(button).toBeDisabled();
    expect(button).not.toHaveAttribute("href");
  });
});
