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

// The Theken-Modus: full-screen, one order per screen, read out loud to the
// Dönermann. Arrays are pools — pick with `pickLine` from "@/lib/funny-lines".
export const thekenCopy = {
  entry: "Theken-Modus",
  entryHints: [
    "Handy hoch, Chef — wir lesen dem Dönermann vor.",
    "Eine Bestellung pro Bildschirm. Groß genug für jede Theke.",
    "Nie wieder „Äh, was wollte Tobias nochmal?“",
    "Vorlesen wie ein Profi, Chef.",
    "Für den großen Auftritt an der Theke.",
  ],
  title: "Theken-Modus",
  close: "Theken-Modus schließen",
  back: "Zurück",
  next: "Nächster",
  finish: "Fertig",
  pickupBadge: "Abholer",
  numberLabel: "Nr.",
  // Kicker above the order — what the Chef says before reading it out.
  readOut: [
    "Sag dem Dönermann:",
    "Einmal bitte:",
    "Laut und deutlich, Chef:",
    "Nächste Bestellung:",
    "Jetzt kommt:",
    "Für die Tüte:",
  ],
  // Under the big icon of a non-Döner line.
  otherProduct: [
    "Kein Döner — aber auch gut.",
    "Ausnahmsweise mal was anderes.",
    "Auch das will bestellt sein, Chef.",
    "Abwechslung muss sein.",
  ],
  finishTitle: "Alles bestellt, Chef!",
  finishLines: [
    "Jetzt nur noch warten und den Fleischduft genießen.",
    "Der Dönermann ist informiert. Das Büro zählt auf dich.",
    "Mission Drehspieß: erfüllt.",
    "Zeit für den Tütenpacker-Endspurt.",
    "Ganz große Theken-Kunst, Chef.",
  ],
  finishRestart: "Nochmal von vorne",
  finishClose: "Zurück zur Liste",
} as const;

// "3 / 12" — the Theken-Modus progress.
export const thekenProgress = (position: number, total: number): string => `${position} / ${total}`;
