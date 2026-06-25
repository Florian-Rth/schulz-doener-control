// German UI strings for the printable Abholer order list. Single-locale app —
// plain constants. The user is the "Chef"; tone stays playful but the printed
// sheet itself is clean enough to hand to the Döner-Laden.

export const printCopy = {
  // Column headers of the order table.
  colCheck: "✓",
  colPerson: "Person",
  colProduct: "Produkt",
  colDetails: "Details",
  colPrice: "Preis",
  // Header + actions.
  abholerLabel: "Abholer:",
  totalLabel: "Gesamt",
  print: "Drucken",
  back: "Zurück zur Übersicht",
  // Empty / error / loading states.
  loading: "Lädt …",
  loadFailed: "Bestellliste konnte nicht geladen werden, Chef.",
  noOpenDay: "Heute läuft kein Döner-Tag, Chef — es gibt nichts zu drucken.",
  noOrders: "Noch keine Bestellungen eingegangen, Chef.",
  // Tiny footer line on the printed sheet.
  footer: "Schulz Döner Control · Büro Leipzig L-01",
} as const;

// "Döner-Tag {date}" — the print sheet title. The date is the German long form
// of the day being printed (the open day is always today).
export const dayTitle = (date: string): string => `Döner-Tag ${date}`;

// "3 Bestellungen" — order-count subline for the printed sheet. The playful
// Döner synonym stays on the dashboard screen but is deliberately dropped here
// to keep the handed-over sheet clean for the Döner-Laden.
export const orderCountSubline = (orderCount: number): string =>
  orderCount === 1 ? "1 Bestellung" : `${orderCount} Bestellungen`;
