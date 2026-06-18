import { ThemeProvider } from "@mui/material/styles";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { theme } from "@/styles/theme";
import { HomePage } from "./HomePage";

describe("HomePage", () => {
  it("zeigt den Titel und spricht den Chef an", () => {
    render(
      <ThemeProvider theme={theme}>
        <HomePage greetingName="Florian" />
      </ThemeProvider>,
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Schulz Döner Control" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Moin, Florian!")).toBeInTheDocument();
    expect(screen.getByText(/Chef/)).toBeInTheDocument();
  });
});
