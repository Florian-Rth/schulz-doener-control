import type { Category, Field, MenuItem } from "./types";

// Pure domain logic for the Döner-Konfigurator. The configurator is a playful
// alternative UI for the existing Döner fields: it writes the `meat` and
// `sauce` answers and folds the Gemüse choices into the free-text field
// ("ohne Zwiebeln, ohne Rotkohl"), so the backend needs no new data.

export const MEAT_FIELD_KEY = "meat";
export const SAUCE_FIELD_KEY = "sauce";

export const VEGGIE_KEYS = ["salat", "tomate", "gurke", "zwiebeln", "rotkohl"] as const;
export type VeggieKey = (typeof VEGGIE_KEYS)[number];

export interface Veggie {
  key: VeggieKey;
  /** Form used in the order text ("ohne Tomaten"). */
  label: string;
  emoji: string;
  /** Pool of questions — the configurator draws one per visit. */
  questions: readonly string[];
}

export const VEGGIES: readonly Veggie[] = [
  {
    key: "salat",
    label: "Salat",
    emoji: "🥬",
    questions: [
      "Salat drauf, Chef?",
      "Bisschen Grünzeug fürs Gewissen?",
      "Salat? Zählt dann als gesund.",
      "Ein Hauch Vitamine, Chef?",
    ],
  },
  {
    key: "tomate",
    label: "Tomaten",
    emoji: "🍅",
    questions: [
      "Tomaten dazu?",
      "Tomaten — die roten Wurfgeschosse?",
      "Tomaten rein, Chef?",
      "Bisschen Matsch-Gefahr gefällig?",
    ],
  },
  {
    key: "gurke",
    label: "Gurken",
    emoji: "🥒",
    questions: [
      "Gurken auch?",
      "Gurkenscheiben im Frisbee-Modus?",
      "Gurke? Knackig, Chef.",
      "Einmal Gurken-Salve?",
    ],
  },
  {
    key: "zwiebeln",
    label: "Zwiebeln",
    emoji: "🧅",
    questions: [
      "Zwiebeln? Denk an das Meeting um 14 Uhr.",
      "Zwiebeln? Die Kollegen werden's merken.",
      "Zwiebeln — Atem-Waffe scharf schalten?",
      "Zwiebeln? Kaugummi liegt in der Küche.",
    ],
  },
  {
    key: "rotkohl",
    label: "Rotkohl",
    emoji: "🟣",
    questions: [
      "Noch Rotkohl obendrauf?",
      "Rotkohl — das lila Konfetti?",
      "Rotkohl? Färbt garantiert aufs Hemd.",
      "Ein bisschen Lila, Chef?",
    ],
  },
];

export type VeggieDecisions = Partial<Record<VeggieKey, boolean>>;

const MIT_ALLEM = "mit allem";

// Every spelling the configurator itself writes or understands, so re-applying
// replaces its previous tokens instead of stacking "ohne Zwiebeln" twice.
const VEGGIE_ALIASES: Record<VeggieKey, readonly string[]> = {
  salat: ["salat"],
  tomate: ["tomate", "tomaten"],
  gurke: ["gurke", "gurken"],
  zwiebeln: ["zwiebel", "zwiebeln"],
  rotkohl: ["rotkohl"],
};

const normalize = (token: string): string => token.trim().toLowerCase().replace(/\s+/g, " ");

const veggieForOhneToken = (token: string): VeggieKey | null => {
  const normalized = normalize(token);
  if (!normalized.startsWith("ohne ")) {
    return null;
  }
  const rest = normalized.slice("ohne ".length);
  for (const key of VEGGIE_KEYS) {
    if (VEGGIE_ALIASES[key].includes(rest)) {
      return key;
    }
  }
  return null;
};

const splitTokens = (text: string): string[] =>
  text
    .split(/[,;\n]/)
    .map((token) => token.trim())
    .filter((token) => token !== "");

const isKonfiguratorToken = (token: string): boolean =>
  normalize(token) === MIT_ALLEM || veggieForOhneToken(token) !== null;

// Only bread-based Döner products get the configurator. Boxes share the Döner
// category (meat + sauce fields) but come without bread, so they are excluded by
// name — the menu has no "has bread" flag.
export const supportsKonfigurator = (
  item: MenuItem | undefined,
  category: Category | undefined,
): boolean => {
  if (item === undefined || category === undefined) {
    return false;
  }
  if (/box|teller/i.test(item.name)) {
    return false;
  }
  const meat = category.fields.find((field) => field.key === MEAT_FIELD_KEY);
  const sauce = category.fields.find((field) => field.key === SAUCE_FIELD_KEY);
  return meat?.type === "single" && sauce?.type === "multi";
};

export const findTextField = (fields: readonly Field[]): Field | undefined =>
  fields.find((field) => field.type === "text");

// Reads the Gemüse choices back out of an existing free-text answer: every
// veggie is "drauf" unless the text says "ohne <veggie>".
export const parseVeggieDecisions = (text: string): Record<VeggieKey, boolean> => {
  const decisions: Record<VeggieKey, boolean> = {
    salat: true,
    tomate: true,
    gurke: true,
    zwiebeln: true,
    rotkohl: true,
  };
  for (const token of splitTokens(text)) {
    const key = veggieForOhneToken(token);
    if (key !== null) {
      decisions[key] = false;
    }
  }
  return decisions;
};

// Writes the Gemüse choices into the free-text answer: earlier configurator
// tokens are replaced, the colleague's own notes ("Soße separat") are kept.
export const mergeExtraText = (text: string, decisions: VeggieDecisions): string => {
  const ownNotes = splitTokens(text).filter((token) => !isKonfiguratorToken(token));
  const without = VEGGIES.filter((veggie) => decisions[veggie.key] === false).map(
    (veggie) => `ohne ${veggie.label}`,
  );
  const prefix = without.length === 0 ? [MIT_ALLEM] : without;
  return [...prefix, ...ownNotes].join(", ");
};
