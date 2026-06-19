// German UI strings for the home/dashboard feature. Single-locale app — plain
// constants. The user is the "Chef"; the greeting uses the real first name.

export const homeCopy = {
  headerTitle: "Döner Control",
  headerSubline: "WERKS-KANTINE · HB-01",
  live: "LIVE",
  greetingSubline: "Donnerstag · die heilige Döner-Schicht",
  tierEyebrow: "Dein Döner-Tier",
  tierFooter: "Alle Tiere ansehen",
  statsEyebrow: "Werks-Überwachung",
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
  notifEyebrow: "Gesendete Benachrichtigung",
  abholerLabel: "Abholer heute:",
  goOrder: "Meine Bestellung abgeben",
  payAbholerCaption: "Öffnet PayPal.Me · Betrag voreingestellt",
  printList: "Bestellliste drucken",
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
  // Loading / error
  loading: "Lädt …",
  loadFailed: "Übersicht konnte nicht geladen werden, Chef.",
} as const;

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
