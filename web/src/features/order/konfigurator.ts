import { VEGGIE_LABELS, type VeggieKey } from "@/components";
import type { Category, Field, MenuItem } from "./types";

// Pure domain logic for the Döner-Konfigurator. The configurator is a playful
// alternative UI for the existing Döner fields: it writes the `meat` and
// `sauce` answers and folds the Gemüse choices into the free-text field
// ("ohne Zwiebeln, ohne Rotkohl"), so the backend needs no new data. That text
// protocol is shared (DoenerStage's build.ts) so any screen can rebuild a Döner.

export const MEAT_FIELD_KEY = "meat";
export const SAUCE_FIELD_KEY = "sauce";

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
    label: VEGGIE_LABELS.salat,
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
    label: VEGGIE_LABELS.tomate,
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
    label: VEGGIE_LABELS.gurke,
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
    label: VEGGIE_LABELS.zwiebeln,
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
    label: VEGGIE_LABELS.rotkohl,
    emoji: "🟣",
    questions: [
      "Noch Rotkohl obendrauf?",
      "Rotkohl — das lila Konfetti?",
      "Rotkohl? Färbt garantiert aufs Hemd.",
      "Ein bisschen Lila, Chef?",
    ],
  },
];

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
