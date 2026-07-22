import { describe, expect, it } from "vitest";
import { AnswersSchema, MenuSchema } from "./schemas";

// Regression: the API emits answer values as `{ options?, text? }` where the unused half may arrive
// as JSON `null` (the server omits nulls now, but the client must stay tolerant). The schema must
// accept null/undefined for either half — a stricter `.optional()` once broke /api/menu parsing for
// every preset (Danny-Box) and thus the whole order + admin menu screens.
describe("order answer schemas", () => {
  it("tolerates null options / text on an answer value", () => {
    const parsed = AnswersSchema.parse({
      meat: { options: ["gemischt"], text: null },
      extra: { options: null, text: "ohne Salat" },
    });

    expect(parsed.meat?.options).toEqual(["gemischt"]);
    expect(parsed.extra?.text).toBe("ohne Salat");
  });

  it("parses a menu whose preset item carries default answers with null halves", () => {
    const menu = MenuSchema.parse({
      categories: [
        {
          key: "doenerbox",
          name: "Dönerbox",
          sortOrder: 1,
          fields: [
            {
              key: "meat",
              label: "Fleisch",
              type: "single",
              display: "segmented",
              maxLength: null,
              required: true,
              options: [{ key: "gemischt", label: "Gemischt", icon: null, priceDeltaCents: 0 }],
            },
          ],
        },
      ],
      items: [
        {
          id: "danny",
          name: "Danny-Box",
          categoryKey: "doenerbox",
          baseItemKey: "box",
          priceCents: 600,
          priceLabel: "6,00 €",
          materialIcon: "workspace_premium",
          note: "Pommes · Fleisch · Soße",
          isInsider: true,
          sortOrder: 5,
          defaultAnswers: {
            meat: { options: ["gemischt"], text: null },
            extra: { options: null, text: "ohne Salat, extra Fleisch" },
          },
        },
      ],
    });

    expect(menu.items[0].defaultAnswers?.meat?.options).toEqual(["gemischt"]);
  });
});
