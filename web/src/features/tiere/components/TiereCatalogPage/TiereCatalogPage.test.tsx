import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import type { TierCatalogEntry } from "@/features/tiere";
import { mswServer } from "@/test/mswServer";
import { renderApp } from "@/test/renderApp";

const authenticatedSession = {
  userId: "11111111-1111-1111-1111-111111111111",
  displayName: "Markus Wagner",
  firstName: "Markus",
  initials: "MW",
  avatarColorHex: "#00728E",
  role: "employee",
  payPalHandleSet: true,
  payPalHandle: "MarkusW",
  mustChangePassword: false,
};

// All 15 Tiere in priority order; Markus's tier (the Knoblauch-Wolf) is `mine`.
const catalog: TierCatalogEntry[] = [
  { emoji: "🦨", name: "Die Bürowaffe", tagline: "Knoblauch UND Schärfe.", isMine: false },
  {
    emoji: "🐺",
    name: "Der Knoblauch-Wolf",
    tagline: "Extra Knobi ist Pflicht.",
    isMine: true,
  },
  { emoji: "🐉", name: "Der Schärfe-Drache", tagline: "Je schärfer, desto besser.", isMine: false },
  { emoji: "🍕", name: "Der Pizza-Verräter", tagline: "Beim Döner-Laden Pizza.", isMine: false },
  { emoji: "📦", name: "Der Danny-Jünger", tagline: "Danny-Box-Apostel.", isMine: false },
  { emoji: "🐗", name: "Die Big-Döner-Wildsau", tagline: "Nur das große Kaliber.", isMine: false },
  { emoji: "🦖", name: "Der Kalb-Rex", tagline: "Ausschließlich Kalb.", isMine: false },
  { emoji: "🐔", name: "Das Angst-Hähnchen", tagline: "Immer auf Nummer sicher.", isMine: false },
  { emoji: "🐙", name: "Der Soßen-Messie", tagline: "Alle Soßen, immer.", isMine: false },
  { emoji: "🐭", name: "Die Trockenmaus", tagline: "Soße? Brauch ich nicht.", isMine: false },
  { emoji: "🦅", name: "Der Dürüm-Adler", tagline: "Gerollt schmeckt's besser.", isMine: false },
  { emoji: "🦫", name: "Der Pommes-Biber", tagline: "Hauptsache Pommes.", isMine: false },
  { emoji: "🐒", name: "Das Chaos-Äffchen", tagline: "Jedes Mal etwas anderes.", isMine: false },
  {
    emoji: "🦥",
    name: "Das Gewohnheits-Faultier",
    tagline: "Seit drei Monaten dasselbe.",
    isMine: false,
  },
  { emoji: "🌯", name: "Der solide Döner-Bürger", tagline: "Solide. Bodenständig.", isMine: false },
];

const useTiereHandlers = (entries: TierCatalogEntry[]): void => {
  mswServer.use(
    http.get("*/api/auth/me", () => HttpResponse.json(authenticatedSession)),
    http.get("*/api/tiere", () => HttpResponse.json(entries)),
  );
};

describe("TiereCatalogPage", () => {
  it("listet alle 15 Tiere und badged das eigene Tier mit DEIN TIER", async () => {
    useTiereHandlers(catalog);
    const { findByText, findAllByText } = renderApp({ initialPath: "/tiere" });

    // Header present.
    expect(await findByText("Döner-Tiere")).toBeInTheDocument();

    // All 15 names render.
    for (const entry of catalog) {
      expect(await findByText(entry.name)).toBeInTheDocument();
    }

    // Exactly one "DEIN TIER" badge, on the caller's tier.
    const badges = await findAllByText("DEIN TIER");
    expect(badges).toHaveLength(1);
  });

  it("navigiert über den Zurück-Knopf zurück zur Übersicht", async () => {
    useTiereHandlers(catalog);
    const user = userEvent.setup();
    const { findByRole, router } = renderApp({ initialPath: "/tiere" });

    const back = await findByRole("button", { name: "Zurück zur Übersicht" });
    await user.click(back);

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/");
    });
  });
});
