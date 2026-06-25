import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithTheme } from "@/test/renderWithTheme";
import { MedalRow } from "./MedalRow";

describe("MedalRow", () => {
  it("zeigt Medaille, Döner-Tier, Name und Anzahl für die Top-Plätze", () => {
    renderWithTheme(
      <MedalRow
        rank={1}
        medal="🥇"
        tierEmoji="🐎"
        displayName="Lukas Brandt"
        avatarColorHex="#00728E"
        count={142}
      />,
    );

    expect(screen.getByText("🥇")).toBeInTheDocument();
    // the person's Döner-Tier glyph sits next to their name
    expect(screen.getByText("🐎")).toBeInTheDocument();
    expect(screen.getByText("Lukas Brandt")).toBeInTheDocument();
    expect(screen.getByText("142")).toBeInTheDocument();
    // Avatar derives initials from the display name.
    expect(screen.getByText("LB")).toBeInTheDocument();
  });

  it("zeigt kein Tier-Emoji, wenn keines gesetzt ist", () => {
    renderWithTheme(
      <MedalRow
        rank={1}
        medal="🥇"
        displayName="Lukas Brandt"
        avatarColorHex="#00728E"
        count={142}
      />,
    );

    expect(screen.queryByText("🐎")).not.toBeInTheDocument();
  });

  it("hebt die eigene Zeile mit '· du' hervor und nutzt die Rangnummer ohne Medaille", () => {
    renderWithTheme(
      <MedalRow rank={4} displayName="Markus Wagner" avatarColorHex="#C90023" count={91} isMe />,
    );

    expect(screen.getByText("4.")).toBeInTheDocument();
    expect(screen.getByText("· du")).toBeInTheDocument();
    expect(screen.getByText("Markus Wagner")).toBeInTheDocument();
  });
});
