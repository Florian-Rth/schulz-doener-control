// German UI strings for the PWA install guide. Single-locale app — the user is the "Chef". Playful
// tone consistent with the rest of the app. Mirrors the iOS-install wording from the push feature.
export const installGuideCopy = {
  eyebrow: "Fast geschafft",
  title: "So installierst du die App",
  intro:
    "Döner Control läuft nur als installierte App, Chef — nur so landen die Push-Benachrichtigungen zum Döner-Tag auch wirklich bei dir. Einmal kurz einrichten, dann hast du sie direkt auf dem Home-Bildschirm.",
  installCta: "Jetzt installieren",
  ios: {
    title: "iPhone / iPad · Safari",
    steps: [
      "Tippe unten in der Leiste auf das Teilen-Symbol (Quadrat mit Pfeil nach oben).",
      "Wähle „Zum Home-Bildschirm“.",
      "Öffne Döner Control über das neue Icon auf dem Home-Bildschirm.",
    ],
  },
  android: {
    title: "Android · Chrome",
    steps: [
      "Öffne oben rechts das Browser-Menü (die drei Punkte ⋮).",
      "Tippe auf „App installieren“ bzw. „Zum Startbildschirm hinzufügen“.",
      "Öffne Döner Control über das neue Icon.",
    ],
  },
  desktop: {
    title: "Desktop · Chrome / Edge",
    steps: [
      "Klick in der Adressleiste rechts auf das Installieren-Symbol (Monitor mit Pfeil).",
      "Bestätige mit „Installieren“.",
      "Öffne Döner Control künftig als eigene App.",
    ],
    note: "Firefox und Safari am Desktop können die App nicht installieren, Chef — nimm Chrome oder Edge, oder mach's einfach am Handy.",
  },
} as const;
