// German UI strings for the printable Abholer order list. Single-locale app —
// plain constants. The user is the "Chef"; tone stays playful but the printed
// sheet itself is clean enough to hand to the Döner-Laden.

export const printCopy = {
  // Column headers of the order table.
  colCheck: "✓",
  colNumber: "Nr.",
  colPerson: "Person",
  colProduct: "Produkt",
  colDetails: "Details",
  colPrice: "Preis",
  // The grouped shop summary that sits above the per-package list.
  summaryHeading: "Für die Theke",
  summaryHint: "Nummer steht auf jeder Tüte — so weiß jeder, was ihm gehört.",
  // Header + actions.
  abholerLabel: "Abholer:",
  totalLabel: "Gesamt",
  print: "Drucken",
  back: "Zurück zur Übersicht",
  // E-mail-the-list-as-PDF action (D-4) — only shown when the backend enables it
  // and the caller has a work e-mail on file.
  emailList: "Liste an meine Mail schicken",
  emailListSending: "Wird verschickt …",
  emailListError: "Konnte die Liste nicht verschicken, Chef.",
  emailListNeedsWorkMail: "Hinterlege zuerst deine Arbeits-Mail im Profil, Chef.",
  emailListNeedsWorkMailCta: "Zu den Einstellungen",
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

// "Liste ist unterwegs an {address}, Chef." — the success toast after the order
// list PDF was e-mailed, echoing back the address the server sent it to (D-4).
export const emailListSuccess = (address: string): string =>
  `Liste ist unterwegs an ${address}, Chef.`;
