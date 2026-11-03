// German UI strings for the success feature. Single-locale app — plain constants.
export const successCopy = {
  // Playful lines come in pools (one line rolled per mount via useFunnyLine).
  titles: ["Erledigt, Chef", "Bestellt, Chef", "Sitzt, Chef", "Ist drin, Chef", "Läuft, Chef"],
  sublines: [
    "Bestellung in der Döner-Telemetrie verbucht ✓",
    "Der Drehspieß weiß jetzt Bescheid ✓",
    "Dein Döner ist offiziell im System ✓",
    "Fleisch-Rucksack reserviert ✓",
    "Bestellung gespeichert. Der Hunger bleibt bis Mittag. ✓",
  ],
  total: "Gesamt",
  owesEyebrow: "Bezahlung an Abholer",
  owesInfoNote:
    "Bezahlen kannst du auf der Startseite, sobald der Abholer den Tag abschließt und abrechnet, Chef.",
  pickupTitles: [
    "Du holst heute ab, Chef!",
    "Du bist heute der Fahrer, Chef!",
    "Abholer-Dienst heute: du, Chef!",
    "Heute trägst du den Fleischeimer, Chef!",
  ],
  pickupCaption: "Die PayPal-Links sind automatisch an dich verschickt 📲",
  back: "Zurück zur Übersicht",
  loading: "Lädt …",
  loadError: "Bestellung konnte nicht geladen werden, Chef.",
  retry: "Nochmal versuchen",
  noAbholerYet:
    "Noch kein Abholer festgelegt — sobald jemand abholt, erfährst du hier, wem du dein Geld schickst, Chef.",
} as const;

// "Du sammelst {amount} von {count} Kollegen ein." — assembled with the
// collect total + colleague count.
export const collectSentence = (amount: string, count: number): string =>
  `Du sammelst ${amount} von ${count} Kollegen ein.`;
