import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithTheme } from "@/test/renderWithTheme";
import { StatCard } from "./StatCard";

describe("StatCard", () => {
  it("zeigt Label, Wert und optionale Einheit", () => {
    renderWithTheme(
      <StatCard icon="euro" label="Diesen Monat" value="312,50" unit=" €" tint="green" />,
    );

    expect(screen.getByText("Diesen Monat")).toBeInTheDocument();
    expect(screen.getByText("312,50")).toBeInTheDocument();
    expect(screen.getByText("€")).toBeInTheDocument();
  });

  it("rendert ohne Einheit, wenn keine angegeben ist", () => {
    renderWithTheme(
      <StatCard icon="payments" label="Offen" value="2" tint="orange" valueColor="orange" />,
    );

    expect(screen.getByText("Offen")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});
