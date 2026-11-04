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
  // Playful lines come in pools (one line rolled per mount via useFunnyLine).
  dayClosedTitles: [
    "Heute hat noch niemand Hunger angemeldet",
    "Der Spieß dreht sich heute ohne Publikum",
    "Kein Döner-Tag. Noch nicht.",
    "Totenstille am Drehspieß",
    "Keiner traut sich, den ersten Döner zu rufen",
    "Der Dönermann wartet auf dein Signal",
  ],
  dayClosedBodies: [
    "Eröffne den Döner-Tag und die Kollegen können einsteigen.",
    "Einer muss den Anfang machen, Chef. Warum nicht du?",
    "Ein Klick, und das ganze Büro weiß Bescheid.",
    "Eröffne den Tag, der Rest kommt von allein. Der Hunger auch.",
    "Sei der Held, den das Büro verdient, Chef. Eröffne den Döner-Tag.",
  ],
  openDay: "Ich will heute Döner!",
  openDayFailed: "Döner-Tag konnte nicht eröffnet werden, Chef.",
  // Day — open state
  dayRunningTitle: "Döner-Tag läuft",
  // Sub-header while ordering is still open (no cutoff yet — the collector
  // decides when to close). Swaps to cutoffSentence(...) once closed.
  orderingOpenSubtitle: "Bestellung läuft · noch offen",
  abholerLabel: "Abholer heute:",
  goOrder: "Meine Bestellung abgeben",
  // Shown instead of goOrder once the caller already has an order — the order form pre-fills the
  // existing order and the submit upserts it, so this is the discoverable "edit" entry point.
  editOrder: "Meine Bestellung ändern",
  // CTA + info line once the collector has closed ordering (FEATURE 4).
  orderingClosedCta: "Bestellung geschlossen",
  orderingClosedInfos: [
    "Der Abholer hat die Bestellung geschlossen, Chef.",
    "Bestellung zu, Chef. Wer jetzt noch Hunger hat, hat Pech.",
    "Zu spät, Chef. Der Abholer hat dichtgemacht.",
    "Die Liste ist zu. Nächste Woche schneller sein, Chef.",
  ],
  printList: "Bestellliste drucken",
  // Empty running-day order list nudge.
  noOrdersYet: [
    "Noch keine Bestellungen — sei der Erste, Chef.",
    "Noch leer hier. Der Erste kriegt die frischeste Soße, Chef.",
    "Null Bestellungen. Die Kollegen zieren sich noch.",
    "So leer wie ein Fladenbrot ohne Füllung.",
    "Noch traut sich keiner. Zeig, wie's geht, Chef.",
  ],
  // Personal status eyebrow on the running-day card (derived from the day).
  statusOrderingInfo: "Bestellung läuft · du bist dabei",
  statusOrderingMissing: "Bestellung läuft · du fehlst noch",
  statusOrderingClosed: "Bestellung geschlossen · warte auf Abholung",
  // No-collector warning + "Ich hole heute ab" (FEATURE 2).
  noCollectorTitles: [
    "Noch kein Abholer, Chef!",
    "Abholer gesucht, Chef!",
    "Kein Fahrer in Sicht, Chef!",
    "Wer holt den Fleischeimer?",
  ],
  noCollectorBodies: [
    "Ohne Fahrer bleibt der Döner im Laden.",
    "Der Döner läuft nicht von allein ins Büro.",
    "Ruhm, Ehre und ein Fleisch-Rucksack warten auf dich.",
    "Irgendwer muss los. Die Drehspieß-Taschen tragen sich nicht selbst.",
    "Ohne Abholer gibt's heute nur Sehnsucht.",
  ],
  // Shown in the no-collector alert when the caller hasn't ordered yet — the
  // backend gates the "Ich hole heute ab" claim on an existing order, so point
  // them at ordering first.
  noCollectorOrderFirst:
    "Gib erst deine Bestellung ab, dann kannst du dich als Abholer eintragen, Chef.",
  claimCollector: "Ich hole heute ab",
  // Collector subsection eyebrow ("Du steuerst den Tag").
  collectorSectionEyebrow: "Du steuerst den Tag",
  // Take-over confirmation (FEATURE 3).
  takeOverCollector: "Ich übernehme die Abholung",
  takeOverDialogTitle: "Abholung übernehmen?",
  takeOverConfirm: "Ja, ich übernehme",
  takeOverCancel: "Doch nicht",
  // claimCollector mutation error toasts (items 2/3).
  claimNeedsOrder: "Erst bestellen, dann abholen, Chef.",
  claimFailed: "Hat nicht geklappt, Chef.",
  // claimCollector 409 — ordering already locked, the Abholer is final (B-2).
  claimOrderingClosed: "Die Bestellung ist schon zu, Chef — der Abholer steht fest.",
  // Abholer-Glücksrad — spins at 12:00 when nobody volunteered.
  wheelTitle: "Abholer-Glücksrad",
  wheelIntros: [
    "12 Uhr, kein Freiwilliger. Jetzt entscheidet das Schicksal, Chef.",
    "Keiner wollte. Also hat das Rad entschieden.",
    "Das Büro hat gekniffen. Das Rad nicht.",
    "Freiwillige vor! … Niemand? Dann eben das Rad.",
  ],
  wheelRespinIntros: [
    "Jemand hatte einen SEHR wichtigen Grund. Das Rad dreht neu.",
    "Ausrede akzeptiert. Widerwillig. Neue Runde!",
    "Einer hat sich rausgeredet. Wen trifft es jetzt?",
  ],
  wheelSpin: "Rad drehen",
  wheelSpinning: "Das Rad dreht …",
  wheelReplay: "Nochmal ansehen",
  wheelVerdictMeTitles: [
    "Tja, Chef. Das Rad hat DICH gewählt.",
    "Glückwunsch, Chef! Du fährst.",
    "Das Schicksal hat gesprochen: Du bist dran, Chef.",
  ],
  wheelExcuseButtons: [
    "Ich hab einen SEHR wichtigen Grund — nochmal drehen",
    "Ich hab gleich ein Meeting mit dem Vorstand — nochmal drehen",
    "Mein Auto ist … äh … in der Werkstatt — nochmal drehen",
    "Meine Oma hat Geburtstag. Schon wieder. — nochmal drehen",
    "Ich bin allergisch gegen Autoschlüssel — nochmal drehen",
    "Ich muss dringend … Dinge tun — nochmal drehen",
  ],
  wheelExcuseDialogTitle: "Wirklich rausreden?",
  wheelExcuseDialogBody:
    "Du fliegst für heute vom Rad und es dreht neu unter den anderen. Alle bekommen Bescheid, Chef. Alle.",
  wheelExcuseConfirm: "Ja, ich kann wirklich nicht",
  wheelExcuseCancel: "Na gut, ich fahr ja schon",
  wheelNoEscape: "Keiner mehr übrig zum Rausreden. Das Rad bleibt bei dir, Chef.",
  wheelNobodyLeft: "Keiner mehr übrig, Chef — das Rad bleibt bei dir.",
  wheelExcuseFailed: "Ausrede abgelehnt, Chef. Versuch's nochmal.",
  // Cash fallback when the recipient has no PayPal handle (item 6).
  payCash: "Bar zahlen",
  // Collector-only close actions (Abholer steuert den Tag)
  closeOrdering: "Bestellung schließen",
  closeDay: "Tag abschließen & abrechnen",
  closeOrderingFailed: "Bestellung konnte nicht geschlossen werden, Chef.",
  closeDayFailed: "Döner-Tag konnte nicht geschlossen werden, Chef.",
  // Collector close-ordering confirm (locks ordering — no debts yet).
  closeOrderingDialogTitle: "Bestellung jetzt schließen?",
  closeOrderingDialogBody:
    "Danach kann KEIN Kollege mehr bestellen oder ändern, Chef — und der Abholer steht endgültig fest.",
  closeOrderingConfirm: "Ja, Bestellung schließen",
  closeOrderingPending: "Wird geschlossen …",
  closeOrderingCancel: "Doch nicht",
  // Collector close-day confirm (settles the day → creates debts).
  closeDayDialogTitle: "Tag abschließen und abrechnen?",
  closeDayDialogBody:
    "Das schließt den Döner-Tag endgültig ab und schreibt allen Kollegen ihre Schulden gut, Chef. Das lässt sich nicht rückgängig machen.",
  closeDayConfirm: "Ja, abschließen & abrechnen",
  closeDayPending: "Wird abgerechnet …",
  closeDayCancel: "Doch nicht",
  // Admin/collector scrap-and-abort: discards all orders and aborts the day (no debts). Available
  // in any state — e.g. an accidental open, or a day to abort. Destructive → confirm before firing.
  adminEndDay: "Döner-Tag abbrechen",
  adminEndDialogTitle: "Döner-Tag wirklich abbrechen?",
  adminEndDialogBody:
    "Das verwirft ALLE Bestellungen und bricht den Tag ab, Chef. Es entstehen keine Schulden — und rückgängig geht's nicht.",
  adminEndConfirm: "Ja, abbrechen",
  adminEndPending: "Wird abgebrochen …",
  adminEndCancel: "Doch nicht",
  adminEndFailed: "Döner-Tag konnte nicht abgebrochen werden, Chef.",
  // PayPal nudge — shown to a user who hasn't set a PayPal handle (dismissable).
  paypalNudgeTitles: [
    "Kein PayPal hinterlegt, Chef",
    "Wohin mit dem Geld, Chef?",
    "Dein PayPal fehlt, Chef",
    "Du lässt Geld liegen, Chef",
  ],
  paypalNudgeBodies: [
    "Ohne PayPal-Link müssen dir die Kollegen bar zahlen. Hinterlege ihn einmal in den Einstellungen.",
    "Ohne PayPal-Link kriegst du dein Döner-Geld nur in Münzen. Einmal hinterlegen, fertig.",
    "Die Kollegen wollen zahlen, wissen aber nicht wohin. Hinterleg deinen PayPal-Link.",
    "Bargeld ist so 2009, Chef. Hinterleg deinen PayPal-Link in den Einstellungen.",
    "Du holst den Döner und kriegst dafür Kleingeld? Hinterleg lieber deinen PayPal-Link.",
  ],
  paypalNudgeCta: "PayPal-Link hinterlegen",
  paypalNudgeDismissLabel: "Hinweis ausblenden",
  // Push-notification nudge — shown when notifications are off but switch-on-able (dismissable, once).
  pushNudgeTitles: [
    "Benachrichtigungen aus, Chef",
    "Funkstille, Chef",
    "Der Döner-Gong ist stumm, Chef",
    "Du hörst nichts, Chef",
  ],
  pushNudgeBodies: [
    "Lass dich pingen, sobald ein Kollege den Döner-Tag eröffnet — dann verpasst du keine Runde.",
    "Schalt Push ein, sonst erfährst du vom Döner-Tag erst durch die Knoblauchfahne der Kollegen.",
    "Ohne Push merkst du den Döner-Tag erst, wenn alle schon kauen.",
    "Ein Ping, und du bist bei der nächsten Runde dabei. Ohne Ping: Kantine.",
  ],
  pushNudgeCta: "Benachrichtigungen einschalten",
  pushNudgeDismissLabel: "Hinweis ausblenden",
  // Leaderboard
  leaderboardTitle: "Döner-Bestenliste",
  leaderboardShowLess: "Nur die Spitze zeigen",
  // Open payments
  paymentsTitle: "Offene Zahlungen",
  // Roast line under the header while the caller still owes someone.
  paymentsNudges: [
    "Zahl mal, Chef. Der Dönermann hat auch Kinder.",
    "Schulden sind wie Zwiebeln, Chef: Sie bleiben hängen.",
    "Der Abholer zählt schon die Tage, Chef.",
    "Ein Klick auf PayPal, und dein Gewissen ist wieder sauber.",
    "Offene Döner-Schulden machen Falten, Chef.",
    "Zahl, bevor der Abholer ein Döner-Tier nach dir benennt.",
  ],
  pay: "PayPal",
  // Read-only settled-payment history (FEATURE 4 / B12).
  paymentHistoryTitle: "Meine letzten Zahlungen",
  paymentHistoryLoadMore: "Ältere Zahlungen laden",
  // Read-only collector receivables card (FEATURE C-2) — what others still owe the caller.
  receivablesTitle: "Was mir noch zusteht",
  receivableOpen: "Offen",
  receivableSettled: "Bezahlt",
  receivablesEmpty: "Dir schuldet gerade keiner was, Chef.",
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

// Döner puns for the greeting subline, a pool per JS weekday (0 = Sonntag … 6 = Samstag).
// The greeting under the name changes with the actual day — Donnerstag is the holy "Dönerstag".
const greetingSublinesByWeekday: Readonly<Record<number, readonly string[]>> = {
  0: [
    "Spieß-Sonntag · auch sonntags dreht sich was",
    "Sofa-Sonntag · der Spieß hat frei, dein Magen nicht",
    "Sonntag · Kraft tanken für Dönerstag",
    "Sonntag · Ruhetag. Außer für den Hunger.",
  ],
  1: [
    "Mampf-Montag · der Spieß rotiert schon",
    "Montag · nur noch drei Tage bis Dönerstag",
    "Montag · die Woche beginnt, der Hunger auch",
    "Montag · Wochenstart ohne Knoblauchfahne. Noch.",
  ],
  2: [
    "Drehspieß-Dienstag · die Rotation beginnt",
    "Dienstag · zwei Tage noch, dann Dönerstag",
    "Dienstag · der Spieß wird schon warmgedreht",
    "Dienstag · scharfe Soße? Wir urteilen nicht",
  ],
  3: [
    "Mampf-Mittwoch · Bergfest mit Fleisch",
    "Mittwoch · morgen ist Dönerstag, nur so als Hinweis",
    "Mittwoch · halbe Woche, ganzer Döner",
    "Mittwoch · Fleisch-Rucksack schon mal packen",
  ],
  4: [
    "Dönerstag · die heilige Döner-Schicht",
    "Dönerstag · der Tag, für den du arbeitest",
    "Dönerstag · Hosenknopf schon mal lockern",
    "Dönerstag · der Osmanische Fleischeimer ruft",
    "Dönerstag · heute ohne Zwiebeln ist Verrat",
  ],
  5: [
    "Fladen-Freitag · Wochenende mit extra Soße",
    "Freitag · Feierabend-Döner ist auch ein Döner",
    "Freitag · die Woche war hart, der Spieß war härter",
    "Freitag · noch sechs Tage bis Dönerstag. Halt durch.",
  ],
  6: [
    "Soßen-Samstag · auch am Wochenende wird gedreht",
    "Samstag · kein Büro, trotzdem Hunger",
    "Samstag · Klappkatze to go?",
    "Samstag · der Spieß macht Überstunden",
  ],
};

// The greeting subline pool for a JS weekday (Date.getDay()); falls back to the Dönerstag pool.
export const greetingSublinesForWeekday = (weekday: number): readonly string[] =>
  greetingSublinesByWeekday[weekday] ?? greetingSublinesByWeekday[4] ?? [];

// "{name} ist gerade dran. …" — the take-over confirmation body naming the
// current Abholer (item 3).
export const takeOverDialogBody = (name: string): string =>
  `${name} ist gerade dran. Wenn du übernimmst, sammelst DU das Geld ein und schließt den Tag, Chef.`;

// "Das Rad hat gesprochen: Sara holt ab!" — the wheel's verdict for everyone but the chosen one.
export const wheelVerdict = (name: string): string => `Das Rad hat gesprochen: ${name} holt ab!`;

// "Ausreden des Tages: Florian, Sara 🙄" — the public shame line under the wheel.
export const wheelExcusedLine = (names: readonly string[]): string =>
  `Ausreden des Tages: ${names.join(", ")} 🙄`;

// "Bestellschluss 11:30 Uhr" — assembled from the cutoff label.
export const cutoffSentence = (cutoffLabel: string): string => `Bestellschluss ${cutoffLabel} Uhr`;

// "{n} dabei" — the participant-count pill on the running day.
export const participantPill = (count: number): string => `${count} dabei`;

// The footer under the leaderboard — templates with {n} (Döner to go) and {rank} (next rank).
export const untilNextTemplates = [
  "Nur noch {n} Döner bis Platz {rank} 🌯",
  "Noch {n} Döner, dann gehört Platz {rank} dir, Chef",
  "Platz {rank} ist nur {n} Döner entfernt. Kau schneller, Chef.",
  "Noch {n} Döner bis Platz {rank}. Der Hosenknopf hält das aus.",
  "Platz {rank} in Sicht: noch {n} Döner 🌯",
] as const;

// "Nur noch X Döner bis Platz N 🌯" — fills one of the untilNextTemplates.
export const untilNextSentence = (template: string, toNext: number, nextRank: number): string =>
  template.replace("{n}", String(toNext)).replace("{rank}", String(nextRank));

// "Alle 12 anzeigen" — the leaderboard expander, naming the full field size.
export const leaderboardShowAll = (total: number): string => `Alle ${total} anzeigen`;

const pickupQuoteFormat = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 });

// "🛵 Holt 2,5 von 10 ab" — the Abholer-Quote under each leaderboard name.
export const pickupQuote = (pickupsPerTenOrders: number): string =>
  `🛵 Holt ${pickupQuoteFormat.format(pickupsPerTenOrders)} von 10 ab`;

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

// The Döner-Weitwurf entry tile on the running day, shown while the Abholer is on the way.
export const waitingGameCopy = {
  title: "Warten auf den Abholer?",
  body: "Wirf ein paar Tomaten in die Eimer, Chef. 30 Sekunden Döner-Weitwurf.",
} as const;
