import type { BucketId, PieceKind, RoastTier } from "./scoring";

// Copy of the Döner-Weitwurf. Playful lines are pools — pick with `pickLine`
// from "@/lib/funny-lines".
export const gameCopy = {
  title: "Döner-Weitwurf",
  back: "Zurück",
  introTitle: "Döner-Weitwurf",
  introBody:
    "Unten hältst du die nächste Zutat. Wisch Richtung Eimer, Chef: Je schneller der Wisch, desto weiter fliegt sie. Was im Eimer liegen bleibt, gibt Punkte. Treffer am Stück geben Kombo-Bonus.",
  introPoints: "Bambini 10 · Stammkunde 25 · Dönermeister 50",
  // The signs over the buckets, near (easy) to far (hard).
  bucketNames: {
    bambini: "Bambini",
    stammkunde: "Stammkunde",
    meister: "Dönermeister",
  } satisfies Record<BucketId, string>,
  pieceNames: {
    fleisch: "Fleisch",
    tomate: "Tomate",
    gurke: "Gurke",
    zwiebel: "Zwiebel",
    salat: "Salat",
    rotkohl: "Rotkohl",
  } satisfies Record<PieceKind, string>,
  nextPiece: (name: string): string => `In der Hand: ${name}`,
  start: "Los geht's",
  intros: [
    "Der Abholer ist unterwegs. Zeit für Sport, Chef.",
    "Warten ist was für Anfänger. Wirf lieber.",
    "30 Sekunden. Ein Brot. Keine Ausreden.",
    "Heute zeigt sich, wer die ruhigste Hand im Büro hat.",
  ],
  scoreLabel: "Punkte",
  timeLabel: "Zeit",
  hitsLabel: "Treffer",
  missesLabel: "Sauerei",
  bestComboLabel: "Beste Kombo",
  comboBadge: (combo: number): string => `Kombo ×${combo}`,
  overtime: "Abpfiff! Die letzten Stücke landen …",
  endTitle: "Abpfiff, Chef!",
  personalBest: "Neuer persönlicher Rekord!",
  saving: "Punkte werden eingetragen …",
  saveFailed: "Konnte die Punkte nicht speichern. Die Ehre bleibt trotzdem.",
  again: "Nochmal",
  home: "Zurück zum Döner-Tag",
  leaderboardToday: "Heute",
  leaderboardAllTime: "Ewige Bestenliste",
  leaderboardEmpty: "Noch keiner hat geworfen. Deine Chance, Chef.",
  leaderboardLoading: "Bestenliste wird geladen …",
  leaderboardError: "Bestenliste ist gerade nicht erreichbar.",
  pointsSuffix: "Pkt.",
  // The end-screen roast, by how the round went.
  roasts: {
    sauerei: [
      "Der Boden hat heute mehr gegessen als du, Chef.",
      "Das war kein Weitwurf, das war Bodenpflege.",
      "Die Eimer sind noch leer. Der Boden nicht.",
      "Die Putzkraft hat dich gerade auf die Liste gesetzt.",
      "Zielwasser vergessen? Passiert. Ständig, offenbar.",
    ],
    solide: [
      "Ordentlich. Der Dönermann nickt anerkennend.",
      "Solide Leistung. Nicht schön, aber satt.",
      "Mit etwas Training wirst du noch Abholer-würdig.",
      "Da geht noch was, Chef. Der Spieß dreht sich weiter.",
    ],
    meister: [
      "Döner-Meister! Der Laden will dich einstellen.",
      "Das war Präzisionsarbeit. Respekt, Chef.",
      "Wenn Döner-Weitwurf olympisch wäre: Gold.",
      "So sauber hat noch keiner eingelocht. Legendär.",
    ],
  } satisfies Record<RoastTier, readonly string[]>,
  sceneHint: "Wisch Richtung Eimer, um zu werfen",
} as const;

export const timeLeftLabel = (seconds: number): string => `${seconds}s`;
