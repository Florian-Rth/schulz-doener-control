import { describe, expect, it } from "vitest";
import { celebrationOf } from "./celebration";
import type { Menu, OrderLineForm } from "./types";

const doenerFields: Menu["categories"][number]["fields"] = [
  {
    key: "meat",
    label: "Fleisch",
    type: "single",
    display: "segmented",
    maxLength: null,
    required: true,
    options: [{ key: "kalb", label: "Kalb", icon: null, priceDeltaCents: 0 }],
  },
  {
    key: "sauce",
    label: "Soße",
    type: "multi",
    display: "chips",
    maxLength: null,
    required: false,
    options: [{ key: "knoblauch", label: "Knoblauch", icon: "🧄", priceDeltaCents: 0 }],
  },
  {
    key: "extra",
    label: "Extrawünsche",
    type: "text",
    display: "textarea",
    maxLength: 300,
    required: false,
    options: [],
  },
];

const item = (id: string, name: string, categoryKey: string, materialIcon: string) => ({
  id,
  name,
  categoryKey,
  baseItemKey: null,
  priceCents: 750,
  priceLabel: "7,50 €",
  materialIcon,
  note: null,
  isInsider: false,
  sortOrder: 1,
  defaultAnswers: null,
});

const menu: Menu = {
  categories: [
    { key: "doener", name: "Döner", sortOrder: 1, fields: doenerFields },
    { key: "pizza", name: "Pizza", sortOrder: 2, fields: [] },
  ],
  items: [
    item("doener", "Döner", "doener", "kebab_dining"),
    item("box", "Dönerbox", "doener", "takeout_dining"),
    item("pizza", "Pizza", "pizza", "local_pizza"),
  ],
};

const line = (productId: string, answers: OrderLineForm["answers"] = {}): OrderLineForm => ({
  productId,
  answers,
  priceCents: 750,
  quantity: 1,
});

describe("celebrationOf", () => {
  it("baut den Döner aus der ersten Konfigurator-Position, auch hinter einer Pizza", () => {
    const celebration = celebrationOf(menu, [
      line("pizza"),
      line("doener", {
        meat: { options: ["kalb"] },
        sauce: { options: ["knoblauch"] },
        extra: { text: "ohne Zwiebeln, Soße separat" },
      }),
    ]);

    expect(celebration.icon).toBe("kebab_dining");
    expect(celebration.build).toEqual({
      meat: "kalb",
      veggies: ["salat", "tomate", "gurke", "rotkohl"],
      sauces: ["knoblauch"],
    });
  });

  it("feiert ohne 3D mit dem Icon des ersten Produkts, wenn kein Brot-Döner dabei ist", () => {
    const celebration = celebrationOf(menu, [
      line("box", { meat: { options: ["kalb"] } }),
      line("pizza"),
    ]);

    expect(celebration).toEqual({ build: null, icon: "takeout_dining" });
  });

  it("fällt auf das Döner-Icon zurück, wenn kein Produkt bekannt ist", () => {
    expect(celebrationOf(menu, [line("unbekannt")])).toEqual({
      build: null,
      icon: "kebab_dining",
    });
  });
});
