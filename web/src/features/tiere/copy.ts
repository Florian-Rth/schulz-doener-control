// German UI strings for the Döner-Tiere catalog. Single-locale app — plain
// constants. Copy taken from the mock's tiere screen.
export const tiereCopy = {
  title: "Döner-Tiere",
  // Playful header tagline, one rolled per mount via useFunnyLine.
  subtitles: [
    "Alle 15 erfassten Exemplare",
    "Die komplette Döner-Fauna",
    "15 Arten, alle artgerecht gefüttert",
    "Artenschutz? Nicht bei uns.",
    "Welches Tier steckt in dir, Chef?",
  ],
  intro:
    "Dein Döner-Tier wird automatisch aus deinen Bestellungen der letzten 3 Monate berechnet. Diese Exemplare sind im System erfasst:",
  back: "Zurück zur Übersicht",
  backIconLabel: "Zurück",
  loading: "Lädt …",
  error: "Tiere konnten nicht geladen werden, Chef.",
} as const;
