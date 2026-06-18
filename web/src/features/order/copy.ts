import type { MeatType, SauceType } from "./types";

// German UI strings for the order feature. Single-locale app — plain constants.
export const orderCopy = {
  headerTitle: "Bestellung, Chef",
  headerSubline: "Döner-Tag · Donnerstag",
  productSection: "Was darf's sein, Chef?",
  pizzaSection: "Welche Pizza?",
  meatSection: "Fleisch",
  sauceSection: "Soße",
  sauceHint: "· Mehrfachauswahl",
  extraSection: "Extrawünsche",
  extraPlaceholder: "Ohne Zwiebeln, viel Salat, Soße separat …",
  priceSection: "Preis",
  pickupTitle: "Ich hole heute ab 🚗",
  pickupSubline: "Du wirst Abholer & sammelst das Geld per PayPal ein.",
  submit: "Bestellung abgeben",
  noOpenDay: "Heute ist noch kein Döner-Tag offen, Chef.",
  cutoffPassed: "Bestellschluss vorbei — heute geht nichts mehr, Chef.",
  submitFailed: "Bestellung konnte nicht gespeichert werden, Chef.",
  insider: "INSIDER",
} as const;

// UI labels for the meat enum (ASCII enum value -> accented German label).
export const MEAT_LABELS: Record<MeatType, string> = {
  Kalb: "Kalb",
  Haehnchen: "Hähnchen",
};

// UI labels + emoji for the sauce enum.
export const SAUCE_LABELS: Record<SauceType, { label: string; emoji: string }> = {
  Kraeuter: { label: "Kräuter", emoji: "🌿" },
  Knoblauch: { label: "Knoblauch", emoji: "🧄" },
  Scharf: { label: "Scharf", emoji: "🌶" },
};
