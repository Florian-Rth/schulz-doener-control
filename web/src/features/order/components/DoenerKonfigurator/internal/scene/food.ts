import type { VeggieKey } from "../../../../konfigurator";

// Food look for the 3D scene. These are material colors of rendered
// ingredients, not UI colors, so they deliberately live outside the MUI theme.

export type PieceShape = "strip" | "leaf" | "halfSlice" | "slice" | "ring" | "shred";
export type SurfaceKind = "meat" | "leaf" | "tomato" | "cucumber" | "plain";

export interface IngredientSpec {
  shape: PieceShape;
  count: number;
  /** Two tints; every piece gets a random blend, multiplied with the surface texture. */
  colors: readonly [string, string];
  surface: SurfaceKind;
  roughness: number;
  /** 0..1 — wet stuff (tomatoes, cucumbers, onions) gets glossier. */
  wetness: number;
  /** Heavier stuff hits harder: drives the bread wobble + camera shake. */
  punch: number;
}

const MEAT_COLORS: Record<string, readonly [string, string]> = {
  kalb: ["#7A4325", "#B06A3E"],
  haehnchen: ["#B8722F", "#E0A25A"],
  gemischt: ["#7A4325", "#D99A52"],
};

export const meatSpec = (optionKey: string): IngredientSpec => ({
  shape: "strip",
  count: 46,
  colors: MEAT_COLORS[optionKey.toLowerCase()] ?? ["#7A4325", "#B06A3E"],
  surface: "meat",
  roughness: 0.62,
  wetness: 0.15,
  punch: 0.09,
});

export const VEGGIE_SPECS: Record<VeggieKey, IngredientSpec> = {
  salat: {
    shape: "leaf",
    count: 26,
    colors: ["#58A834", "#B4E07E"],
    surface: "leaf",
    roughness: 0.55,
    wetness: 0.2,
    punch: 0.04,
  },
  tomate: {
    shape: "halfSlice",
    count: 9,
    colors: ["#FFFFFF", "#F2DADA"],
    surface: "tomato",
    roughness: 0.32,
    wetness: 1,
    punch: 0.07,
  },
  gurke: {
    shape: "slice",
    count: 10,
    colors: ["#FFFFFF", "#E6F0DC"],
    surface: "cucumber",
    roughness: 0.35,
    wetness: 0.9,
    punch: 0.06,
  },
  zwiebeln: {
    shape: "ring",
    count: 12,
    colors: ["#F6EEF6", "#C9A3D2"],
    surface: "plain",
    roughness: 0.3,
    wetness: 0.7,
    punch: 0.05,
  },
  rotkohl: {
    shape: "shred",
    count: 20,
    colors: ["#5C1850", "#9A3D84"],
    surface: "plain",
    roughness: 0.45,
    wetness: 0.5,
    punch: 0.03,
  },
};

const SAUCE_COLORS: Record<string, string> = {
  kraeuter: "#E3ECCB",
  knoblauch: "#FBF8F0",
  scharf: "#C7361F",
};

export const sauceColor = (optionKey: string): string =>
  SAUCE_COLORS[optionKey.toLowerCase()] ?? "#E9D8A6";

export const BREAD_COLORS = {
  crumb: "#F3DDB1",
  /** Multiplied over the crumb texture: warm, slightly toasted cut face. */
  crumbTint: "#E6C99A",
  sesame: "#F4E4BC",
  nigella: "#2A2420",
} as const;
