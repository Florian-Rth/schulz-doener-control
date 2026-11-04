import { describe, expect, it } from "vitest";
import { supportsKonfigurator } from "./konfigurator";
import type { Category, MenuItem } from "./types";

const doenerCategory: Category = {
  key: "doener",
  name: "Döner",
  sortOrder: 1,
  fields: [
    {
      key: "meat",
      label: "Fleisch",
      type: "single",
      display: "segmented",
      maxLength: null,
      required: true,
      options: [],
    },
    {
      key: "sauce",
      label: "Soße",
      type: "multi",
      display: "chips",
      maxLength: null,
      required: false,
      options: [],
    },
  ],
};

const item = (name: string): MenuItem => ({
  id: name,
  name,
  categoryKey: "doener",
  baseItemKey: null,
  priceCents: 750,
  priceLabel: "7,50 €",
  materialIcon: "kebab_dining",
  note: null,
  isInsider: false,
  sortOrder: 1,
  defaultAnswers: null,
});

describe("supportsKonfigurator", () => {
  it("offers the configurator for bread-based Döner products", () => {
    expect(supportsKonfigurator(item("Döner"), doenerCategory)).toBe(true);
    expect(supportsKonfigurator(item("Big Döner"), doenerCategory)).toBe(true);
  });

  it("skips boxes and categories without meat + sauce fields", () => {
    expect(supportsKonfigurator(item("Dönerbox"), doenerCategory)).toBe(false);
    expect(supportsKonfigurator(item("Danny-Box"), doenerCategory)).toBe(false);
    expect(supportsKonfigurator(item("Pizza"), { ...doenerCategory, fields: [] })).toBe(false);
    expect(supportsKonfigurator(undefined, doenerCategory)).toBe(false);
  });
});
