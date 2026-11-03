import type { RoastTier } from "./scoring";

// Copy of the Döner-Weitwurf. Playful lines are pools — pick with `pickLine`
// from "@/lib/funny-lines".
export const gameCopy = {
  title: "Döner-Weitwurf",
  back: "Zurück",
  introTitle: "Döner-Weitwurf",
  introBody:
    "Wisch von unten nach oben, Chef: Richtung und Tempo bestimmen den Wurf. Alles, was im Brot liegen bleibt, gibt Punkte. Treffer am Stück geben Kombo-Bonus.",
  introPoints: "Fleisch 30 · Zwiebel 25 · Tomate/Gurke 20 · Rotkohl 15 · Salat 10",
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
  // Comic words over the stage.
  hitWords: ["ZACK!", "VOLLTREFFER!", "KLATSCH!", "DRIN!", "BÄM!", "SAUBER!"],
  comboWords: ["KOMBO!", "LÄUFT!", "UNAUFHALTSAM!", "DÖNER-GOTT!", "WAHNSINN!"],
  missWords: ["SAUEREI!", "PLATSCH!", "DANEBEN!", "OH NEIN!", "BODENHAFTUNG!"],
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
      "So sauber hat noch keiner gefüllt. Legendär.",
    ],
  } satisfies Record<RoastTier, readonly string[]>,
  sceneHint: "Wisch nach oben, um zu werfen",
} as const;

export const timeLeftLabel = (seconds: number): string => `${seconds}s`;
