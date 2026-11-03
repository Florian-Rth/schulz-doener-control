// German UI strings for the Web-Push subscribe flow. Single-locale app — the
// user is the "Chef". Playful tone consistent with the rest of the app.
export const pushCopy = {
  // Page shell (the dedicated notification-settings screen).
  pageTitle: "Benachrichtigungen",
  pageSubtitle: "BÜRO LEIPZIG · L-01",
  // Playful lines come in pools (one line rolled per mount via useFunnyLine).
  pageIntros: [
    "Lass dich pingen, sobald die heilige Döner-Schicht beginnt, Chef.",
    "Nie wieder vom Döner-Tag aus zweiter Hand erfahren, Chef.",
    "Wer Push hat, isst zuerst, Chef.",
    "Ein Ping, und dein Magen weiß Bescheid, Chef.",
  ],
  back: "Zurück zur Übersicht",
  backIconLabel: "Zurück",
  eyebrow: "Benachrichtigungen",
  titles: [
    "Verpass keinen Döner-Tag",
    "Kein Döner ohne dich",
    "Ohren auf, Chef",
    "Der Spieß ruft. Hörst du ihn?",
  ],
  intro:
    "Aktiviere Push und du bekommst sofort Bescheid, sobald ein Kollege den Döner-Tag eröffnet, Chef.",
  enable: "Push aktivieren",
  enabling: "Wird aktiviert …",
  disable: "Push deaktivieren",
  // Every line starts with "Push ist aktiv." so the state stays unmistakable.
  subscribedLines: [
    "Push ist aktiv. Du wirst beim nächsten Döner-Tag geweckt. 🥙",
    "Push ist aktiv. Ab jetzt entgeht dir kein Spieß mehr. 🥙",
    "Push ist aktiv. Dein Handy knurrt jetzt mit deinem Magen. 🥙",
    "Push ist aktiv. Wir melden uns, sobald es nach Knoblauch riecht. 🥙",
  ],
  deniedTitle: "Benachrichtigungen sind blockiert",
  denied:
    "Du hast Push abgelehnt, Chef. Erlaube Benachrichtigungen in den Browser-Einstellungen und versuch es erneut.",
  unsupportedTitle: "Push wird hier nicht unterstützt",
  unsupported:
    "Dein Browser kann keine Push-Benachrichtigungen. Schau auf dem Handy im Standard-Browser vorbei.",
  iosInstallTitle: "iPhone? Kurz zum Home-Bildschirm hinzufügen",
  iosInstall:
    "Auf dem iPhone gibt's Push nur aus der installierten App, Chef. Tippe unten auf das Teilen-Symbol, wähle „Zum Home-Bildschirm“ und öffne Döner Control über das neue Icon — dann kannst du hier aktivieren.",
  error: "Hat nicht geklappt, Chef. Versuch es gleich nochmal.",
  // Notification shown by the service worker on an incoming push.
  notificationFallbackTitle: "Schulz Döner Control",
  notificationFallbackBody: "Es gibt Neuigkeiten vom Döner-Tag.",
} as const;
