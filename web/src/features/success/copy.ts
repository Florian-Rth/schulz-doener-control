// German UI strings for the success feature. Single-locale app — plain constants.
export const successCopy = {
  title: "Erledigt, Chef",
  subline: "Bestellung in der Werks-Telemetrie verbucht ✓",
  total: "Gesamt",
  owesEyebrow: "Bezahlung an Abholer",
  payButtonPrefix: "Jetzt",
  payButtonSuffix: "per PayPal senden",
  owesCaption: "Öffnet PayPal.Me · Betrag voreingestellt",
  pickupTitle: "Du holst heute ab, Chef!",
  pickupCaption: "Die PayPal-Links sind automatisch an dich verschickt 📲",
  back: "Zurück zur Übersicht",
  loading: "Lädt …",
} as const;

// "Du sammelst {amount} von {count} Kollegen ein." — assembled with the
// collect total + colleague count.
export const collectSentence = (amount: string, count: number): string =>
  `Du sammelst ${amount} von ${count} Kollegen ein.`;
