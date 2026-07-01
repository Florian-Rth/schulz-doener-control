// German UI strings for the success feature. Single-locale app — plain constants.
export const successCopy = {
  title: "Erledigt, Chef",
  subline: "Bestellung in der Döner-Telemetrie verbucht ✓",
  total: "Gesamt",
  owesEyebrow: "Bezahlung an Abholer",
  owesInfoNote:
    "Bezahlen kannst du auf der Startseite, sobald der Abholer den Tag abschließt und abrechnet, Chef.",
  pickupTitle: "Du holst heute ab, Chef!",
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
