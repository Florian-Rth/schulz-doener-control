// The Döner as data: what the 3D stage renders, and the text protocol that
// stores the Gemüse in an order's free-text answer ("ohne Zwiebeln, Soße
// separat" / "mit allem"). Shared so every screen — Konfigurator, Abholer
// counter, celebration — rebuilds the same Döner from the same order.

export const VEGGIE_KEYS = ["salat", "tomate", "gurke", "zwiebeln", "rotkohl"] as const;
export type VeggieKey = (typeof VEGGIE_KEYS)[number];

/** What is in the bread — in the order it goes in. */
export interface DoenerBuild {
  /** Meat option key ("kalb", "haehnchen", …), or null before the meat is in. */
  meat: string | null;
  veggies: VeggieKey[];
  /** Sauce option keys ("knoblauch", "scharf", …). */
  sauces: string[];
}

export const EMPTY_BUILD: DoenerBuild = { meat: null, veggies: [], sauces: [] };

/** Form used in the order text ("ohne Tomaten"). */
export const VEGGIE_LABELS: Record<VeggieKey, string> = {
  salat: "Salat",
  tomate: "Tomaten",
  gurke: "Gurken",
  zwiebeln: "Zwiebeln",
  rotkohl: "Rotkohl",
};

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
    .split(/[,;\n·]/)
    .map((token) => token.trim())
    .filter((token) => token !== "");

const isProtocolToken = (token: string): boolean =>
  normalize(token) === MIT_ALLEM || veggieForOhneToken(token) !== null;

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

// Writes the Gemüse choices into the free-text answer: earlier protocol
// tokens are replaced, the colleague's own notes ("Soße separat") are kept.
export const mergeExtraText = (text: string, decisions: VeggieDecisions): string => {
  const ownNotes = splitTokens(text).filter((token) => !isProtocolToken(token));
  const without = VEGGIE_KEYS.filter((key) => decisions[key] === false).map(
    (key) => `ohne ${VEGGIE_LABELS[key]}`,
  );
  const prefix = without.length === 0 ? [MIT_ALLEM] : without;
  return [...prefix, ...ownNotes].join(", ");
};

export interface DoenerAnswers {
  meat: string | null;
  sauces: readonly string[];
  /** The free-text answer (Extrawünsche); Gemüse is read from its ohne-tokens. */
  text: string;
}

/** The Döner an order describes — Gemüse "mit allem" unless the text says ohne. */
export const buildFromAnswers = ({ meat, sauces, text }: DoenerAnswers): DoenerBuild => {
  const decisions = parseVeggieDecisions(text);
  return {
    meat,
    veggies: VEGGIE_KEYS.filter((key) => decisions[key]),
    sauces: [...sauces],
  };
};

/** The user's own notes in the free text, without the Gemüse protocol tokens. */
export const ownNotesOf = (text: string): string[] =>
  splitTokens(text).filter((token) => !isProtocolToken(token));
