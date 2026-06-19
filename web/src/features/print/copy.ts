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
  footer: "Schulz Döner Control · Werks-Kantine HB-01",
} as const;

// "Döner-Tag {date}" — the print sheet title. The date is the German long form
// of the day being printed (the open day is always today).
export const dayTitle = (date: string): string => `Döner-Tag ${date}`;

// "Drehspieß-Tasche · 3 Bestellungen" — the synonym + order-count subline.
export const synonymSubline = (synonym: string | null, orderCount: number): string => {
  const orders = orderCount === 1 ? "1 Bestellung" : `${orderCount} Bestellungen`;
  return synonym !== null ? `${synonym} · ${orders}` : orders;
};
