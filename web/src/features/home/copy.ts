// German UI strings for the home/dashboard feature. Single-locale app — plain
// constants. The user is the "Chef"; the greeting uses the real first name.

export const homeCopy = {
  headerTitle: "Döner Control",
  headerSubline: "BÜRO LEIPZIG · L-01",
  headerLogoAlt: "Schulz Döner Control",
  live: "LIVE",
  tierEyebrow: "Dein Döner-Tier",
  tierFooter: "Alle Tiere ansehen",
  statsEyebrow: "Döner-Überwachung",
  statTotal: "Döner gesamt",
  statMonth: "Diesen Monat",
  statOpen: "Offen",
  statStreak: "Streak",
  monthUnit: " €",
  streakUnit: " Wo.",
  // Day — closed state
  dayClosedEyebrow: "Status: Kein Döner-Tag",
  dayClosedTitle: "Heute hat noch niemand Hunger angemeldet",
  dayClosedBody: "Eröffne den Döner-Tag und die Kollegen können einsteigen.",
  openDay: "Ich will heute Döner!",
  openDayFailed: "Döner-Tag konnte nicht eröffnet werden, Chef.",
  // Day — open state
  dayRunningTitle: "Döner-Tag läuft",
  // Sub-header while ordering is still open (no cutoff yet — the collector
  // decides when to close). Swaps to cutoffSentence(...) once closed.
  orderingOpenSubtitle: "Bestellung läuft · noch offen",
  abholerLabel: "Abholer heute:",
  goOrder: "Meine Bestellung abgeben",
  // CTA + info line once the collector has closed ordering (FEATURE 4).
  orderingClosedCta: "Bestellung geschlossen",
  orderingClosedInfo: "Der Abholer hat die Bestellung geschlossen, Chef.",
  payAbholerCaption: "Öffnet PayPal.Me · Betrag voreingestellt",
  printList: "Bestellliste drucken",
  // Empty running-day order list nudge.
  noOrdersYet: "Noch keine Bestellungen — sei der Erste, Chef.",
  // Personal status eyebrow on the running-day card (derived from the day).
  statusOrderingInfo: "Bestellung läuft · du bist dabei",
  statusOrderingMissing: "Bestellung läuft · du fehlst noch",
  statusOrderingClosed: "Bestellung geschlossen · warte auf Abholung",
  // No-collector warning + "Ich hole heute ab" (FEATURE 2).
  noCollectorTitle: "Noch kein Abholer, Chef!",
  noCollectorBody: "Ohne Fahrer bleibt der Döner im Laden.",
  // Shown in the no-collector alert when the caller hasn't ordered yet — the
  // backend gates the "Ich hole heute ab" claim on an existing order, so point
  // them at ordering first.
  noCollectorOrderFirst:
    "Gib erst deine Bestellung ab, dann kannst du dich als Abholer eintragen, Chef.",
  claimCollector: "Ich hole heute ab",
  // Take-over confirmation (FEATURE 3).
  takeOverCollector: "Ich übernehme die Abholung",
  takeOverDialogTitle: "Abholung übernehmen?",
  takeOverConfirm: "Ja, ich übernehme",
  takeOverCancel: "Doch nicht",
  // claimCollector mutation error toasts (items 2/3).
  claimNeedsOrder: "Erst bestellen, dann abholen, Chef.",
  claimFailed: "Hat nicht geklappt, Chef.",
  // Cash fallback when the recipient has no PayPal handle (item 6).
  payCash: "Bar zahlen",
  // Collector-only close actions (Abholer steuert den Tag)
  closeOrdering: "Bestellung schließen",
  closeDay: "Döner-Tag schließen",
  closeOrderingFailed: "Bestellung konnte nicht geschlossen werden, Chef.",
  closeDayFailed: "Döner-Tag konnte nicht geschlossen werden, Chef.",
  // Leaderboard
  leaderboardTitle: "Döner-Bestenliste",
  // Open payments
  paymentsTitle: "Offene Zahlungen",
  pay: "PayPal",
  // Read-only settled-payment history (FEATURE 4 / B12).
  paymentHistoryTitle: "Meine letzten Zahlungen",
  // Per-debt "ich hab bezahlt" confirmation (FEATURE 4 settle). One-way: a
  // settled debt verschwindet aus der Liste und kann nicht zurückgeholt werden.
  settle: "Erledigt",
  settleDialogTitle: "Schuld als bezahlt markieren?",
  settleDialogBody:
    "Bestätige nur, wenn du wirklich gezahlt hast, Chef. Die Schuld verschwindet dann aus deiner Liste — das lässt sich nicht rückgängig machen.",
  settleConfirm: "Hab ich bezahlt",
  settlePending: "Wird abgehakt …",
  settleCancel: "Doch nicht",
  // Header LIVE pill — only shown while a day is open; otherwise this static
  // label makes clear nothing is running (item 1/5).
  noDayPill: "Kein Döner-Tag",
  // Loading / error
  loading: "Lädt …",
  loadFailed: "Übersicht konnte nicht geladen werden, Chef.",
  retry: "Nochmal versuchen",
} as const;

// A funny Döner pun for the greeting subline, keyed by JS weekday (0 = Sonntag … 6 = Samstag).
// The greeting under the name changes with the actual day — Donnerstag is the holy "Dönerstag".
const greetingSublinesByWeekday: Readonly<Record<number, string>> = {
  0: "Spieß-Sonntag · auch sonntags dreht sich was",
  1: "Mampf-Montag · der Spieß rotiert schon",
  2: "Drehspieß-Dienstag · die Rotation beginnt",
  3: "Mampf-Mittwoch · Bergfest mit Fleisch",
  4: "Dönerstag · die heilige Döner-Schicht",
  5: "Fladen-Freitag · Wochenende mit extra Soße",
  6: "Soßen-Samstag · auch am Wochenende wird gedreht",
};

// The greeting subline for a given JS weekday (Date.getDay()); falls back to the Dönerstag line.
export const greetingSublineForWeekday = (weekday: number): string =>
  greetingSublinesByWeekday[weekday] ?? greetingSublinesByWeekday[4];

// "{name} hat kein PayPal hinterlegt — bitte bar bezahlen, Chef." — the cash
// fallback alert on the open-day card when the Abholer has no handle (item 6).
export const payCashAbholer = (name: string): string =>
  `${name} hat kein PayPal hinterlegt — bitte bar bezahlen, Chef.`;

// "{name} ist gerade dran. …" — the take-over confirmation body naming the
// current Abholer (item 3).
export const takeOverDialogBody = (name: string): string =>
  `${name} ist gerade dran. Wenn du übernimmst, sammelst DU das Geld ein und schließt den Tag, Chef.`;

// "Jetzt an {name} zahlen" — the Abholer pay-button label on the open-day card.
export const payAbholerLabel = (name: string): string => `Jetzt an ${name} zahlen`;

// "Bestellschluss 11:30 Uhr" — assembled from the cutoff label.
export const cutoffSentence = (cutoffLabel: string): string => `Bestellschluss ${cutoffLabel} Uhr`;

// "{n} dabei" — the participant-count pill on the running day.
export const participantPill = (count: number): string => `${count} dabei`;

// "Nur noch X Döner bis Platz N 🌯" — the footer under the leaderboard.
export const untilNextSentence = (toNext: number, nextRank: number): string =>
  `Nur noch ${toNext} Döner bis Platz ${nextRank} 🌯`;

// "Aus N Bestellungen der letzten 3 Monate" — the tier order-count line.
export const tierOrderCountSentence = (count: number): string =>
  `Aus ${count} Bestellungen der letzten 3 Monate`;

// "18. Juni 2026" — short German date for a settled-payment history row, parsed
// from the row's ISO-8601 `settledAt` timestamp.
export const formatSettledDate = (settledAt: string): string =>
  new Date(settledAt).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
