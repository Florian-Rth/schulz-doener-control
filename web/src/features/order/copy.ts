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
  quantitySection: "Menge",
  addLine: "+ weitere Position",
  removeLine: "Position entfernen",
  lineEyebrow: "Position",
  orderTotal: "Gesamt",
  pickupTitle: "Ich hole heute ab 🚗",
  pickupSubline: "Du wirst Abholer & sammelst das Geld per PayPal ein.",
  submit: "Bestellung abgeben",
  noOpenDay: "Heute ist noch kein Döner-Tag offen, Chef.",
  cutoffPassed: "Der Abholer hat die Bestellung geschlossen — heute geht nichts mehr, Chef.",
  submitFailed: "Bestellung konnte nicht gespeichert werden, Chef.",
  insider: "INSIDER",
  // Withdraw the caller's order (e.g. they have to leave for a meeting). Only while ordering is open.
  removeOrder: "Meine Bestellung entfernen",
  removeConfirmTitle: "Bestellung entfernen?",
  removeConfirmBody: "Dann bist du heute raus, Chef — deine Bestellung wird komplett gelöscht.",
  removeConfirmCta: "Ja, entfernen",
  removePending: "Wird entfernt …",
  removeCancel: "Doch nicht",
  removeFailed: "Bestellung konnte nicht entfernt werden, Chef.",
} as const;

// UI labels for the meat enum (ASCII enum value -> accented German label).
export const MEAT_LABELS: Record<MeatType, string> = {
  Kalb: "Kalb",
  Haehnchen: "Hähnchen",
  Gemischt: "Gemischt",
};

// UI labels + emoji for the sauce enum.
export const SAUCE_LABELS: Record<SauceType, { label: string; emoji: string }> = {
  Kraeuter: { label: "Kräuter", emoji: "🌿" },
  Knoblauch: { label: "Knoblauch", emoji: "🧄" },
  Scharf: { label: "Scharf", emoji: "🌶" },
};
