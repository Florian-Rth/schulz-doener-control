// German UI strings for the success feature. Single-locale app — plain constants.
export const successCopy = {
  title: "Erledigt, Chef",
  subline: "Bestellung in der Döner-Telemetrie verbucht ✓",
  total: "Gesamt",
  owesEyebrow: "Bezahlung an Abholer",
  payButtonPrefix: "Jetzt",
  payButtonSuffix: "per PayPal senden",
  owesCaption: "Öffnet PayPal.Me · Betrag voreingestellt",
  pickupTitle: "Du holst heute ab, Chef!",
  pickupCaption: "Die PayPal-Links sind automatisch an dich verschickt 📲",
  back: "Zurück zur Übersicht",
  loading: "Lädt …",
  loadError: "Bestellung konnte nicht geladen werden, Chef.",
  retry: "Nochmal versuchen",
  noAbholerYet:
    "Noch kein Abholer festgelegt — sobald jemand abholt, erfährst du hier, wem du dein Geld schickst, Chef.",
} as const;

// "Kein PayPal hinterlegt — bitte {name} {amount} in bar geben, Chef." — the cash
// fallback shown when the abholer has no PayPal handle on file.
export const cashFallbackSentence = (name: string, amount: string): string =>
  `Kein PayPal hinterlegt — bitte ${name} ${amount} in bar geben, Chef.`;

// "Du sammelst {amount} von {count} Kollegen ein." — assembled with the
// collect total + colleague count.
export const collectSentence = (amount: string, count: number): string =>
  `Du sammelst ${amount} von ${count} Kollegen ein.`;
