// Copy of the shared 3D Döner stage. Playful lines are pools — pick with
// `pickLine` from "@/lib/funny-lines".
export const doenerStageCopy = {
  loading: [
    "Brot wird aufgebacken …",
    "Drehspieß wird angeworfen …",
    "Physik wird kalibriert …",
    "Soßenflaschen werden geschüttelt …",
    "Zwiebeln werden zum Weinen gebracht …",
    "Messer wird gewetzt …",
  ],
  noWebgl: "Dein Gerät kann leider kein 3D, Chef. Der Döner bleibt Fantasie.",
  sceneLabel: "3D-Vorschau deines Döners",
  // Comic bursts when something slams into the bread.
  impactWords: [
    "KLATSCH!",
    "WUMMS!",
    "ZACK!",
    "BÄM!",
    "RUMMS!",
    "FLATSCH!",
    "PATSCH!",
    "KAWUMM!",
    "PLATSCH!",
    "SCHEPPER!",
  ],
  sauceWords: ["SPRITZ!", "SCHLOTZ!", "SPLATSCH!", "BLUBB!", "SCHMATZ!", "PLÖRR!"],
} as const;
