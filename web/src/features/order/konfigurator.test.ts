import { describe, expect, it } from "vitest";
import { mergeExtraText, parseVeggieDecisions, supportsKonfigurator } from "./konfigurator";
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

describe("parseVeggieDecisions", () => {
  it("treats everything as drauf unless the text says ohne", () => {
    expect(parseVeggieDecisions("Ohne Zwiebeln, ohne tomaten, Soße separat")).toEqual({
      salat: true,
      tomate: false,
      gurke: true,
      zwiebeln: false,
      rotkohl: true,
    });
  });
});

describe("mergeExtraText", () => {
  it("writes ohne-tokens and keeps the colleague's own notes", () => {
    expect(mergeExtraText("Soße separat", { zwiebeln: false, salat: true })).toBe(
      "ohne Zwiebeln, Soße separat",
    );
  });

  it("replaces earlier configurator tokens instead of stacking them", () => {
    expect(mergeExtraText("ohne Zwiebeln, Soße separat", { rotkohl: false })).toBe(
      "ohne Rotkohl, Soße separat",
    );
  });

  it("writes mit allem when nothing is left out", () => {
    expect(mergeExtraText("mit allem, extra scharf", {})).toBe("mit allem, extra scharf");
    expect(mergeExtraText("", {})).toBe("mit allem");
  });
});
