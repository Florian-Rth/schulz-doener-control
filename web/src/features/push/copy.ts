// German UI strings for the Web-Push subscribe flow. Single-locale app — the
// user is the "Chef". Playful tone consistent with the rest of the app.
export const pushCopy = {
  // Page shell (the dedicated notification-settings screen).
  pageTitle: "Benachrichtigungen",
  pageSubtitle: "BÜRO LEIPZIG · L-01",
  pageIntro: "Lass dich pingen, sobald die heilige Döner-Schicht beginnt, Chef.",
  back: "Zurück zur Übersicht",
  backIconLabel: "Zurück",
  eyebrow: "Benachrichtigungen",
  title: "Verpass keinen Döner-Tag",
  intro:
    "Aktiviere Push und du bekommst sofort Bescheid, sobald ein Kollege den Döner-Tag eröffnet, Chef.",
  enable: "Push aktivieren",
  enabling: "Wird aktiviert …",
  disable: "Push deaktivieren",
  subscribed: "Push ist aktiv. Du wirst beim nächsten Döner-Tag geweckt. 🥙",
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
