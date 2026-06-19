// German UI strings for the admin area. Single-locale app — plain constants.
// Addresses the operator as "Chef" per the house tone.
export const adminCopy = {
  title: "Admin-Bereich",
  subtitle: "Steuerstand für den Döner-Tag",
  intro: "Hier ziehst du die Fäden, Chef. Wähl deinen Bereich.",
  back: "Zurück zur Übersicht",
  backIconLabel: "Zurück",
  cards: {
    benutzer: {
      title: "Benutzer",
      description: "Mannschaft anlegen, Rollen vergeben, Passwörter zurücksetzen.",
      icon: "workspace_premium",
    },
    menue: {
      title: "Menü",
      description: "Döner, Pizza & Insider-Spezialitäten pflegen.",
      icon: "restaurant",
    },
    tiere: {
      title: "Döner-Tiere",
      description: "Die 15 erfassten Exemplare und ihre Bedingungen.",
      icon: "kebab_dining",
    },
  },
} as const;
