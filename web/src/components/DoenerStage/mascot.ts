// The Döner-Tier mascot of the stage: a cardboard standee ("Pappaufsteller")
// next to the Döner that catches stray ingredients. This file holds its public
// props and the plain logic (no three.js): placement, labels, copy, tipping.

export type MascotSide = "left" | "right";

export interface DoenerMascotProps {
  /** The Tier's emoji, painted big on the cardboard. */
  emoji: string;
  /** The Tier's name for the plate, e.g. "Der Knoblauch-Wolf". */
  name: string;
  /** Which end of the Döner it stands next to. */
  side?: MascotSide;
  /**
   * Exact spot on the plate (x along the Döner, z towards the camera),
   * overrides `side` — for several mascots on one stage.
   */
  position?: readonly [number, number];
  /** Seeds its speech bubbles — roll once per screen with `rollSeed`. */
  seed?: number;
  /** "AUA!" speech bubbles when it gets hit or knocked over. */
  speech?: boolean;
  /** Every noticeable hit on the mascot, with its strength (0 … 1). */
  onHit?: (strength: number) => void;
}

export interface MascotPlacement {
  x: number;
  z: number;
  /** Rotation around y so its face looks at the front of the showroom. */
  yaw: number;
}

// Just past the end of the bread (half length 1.55, its rounded end is thin
// there), a bit to the front: in frame on portrait phones and wide screens.
const SIDE_X = 1.7;
const SIDE_Z = 0.8;
// The point the standee turns its face to: where the camera starts.
const FACE_TOWARDS_Z = 9;

export const mascotPlacement = (
  side: MascotSide,
  position?: readonly [number, number],
): MascotPlacement => {
  const x = position?.[0] ?? (side === "left" ? -SIDE_X : SIDE_X);
  const z = position?.[1] ?? SIDE_Z;
  return { x, z, yaw: Math.atan2(-x, FACE_TOWARDS_Z - z) };
};

export interface TierLabel {
  /** "Der" / "Die" / "Das", printed small above the title — null without one. */
  article: string | null;
  title: string;
}

const ARTICLES = ["Der", "Die", "Das"];

export const splitTierName = (name: string): TierLabel => {
  const words = name.trim().split(/\s+/);
  const [first, ...rest] = words;
  if (first !== undefined && rest.length > 0 && ARTICLES.includes(first)) {
    return { article: first, title: rest.join(" ") };
  }
  return { article: null, title: words.join(" ") };
};

/** Width of `text` at `fontSize` — a canvas `measureText` in the scene, a stub in tests. */
export type MeasureText = (text: string, fontSize: number) => number;

export interface FittedText {
  lines: string[];
  fontSize: number;
}

// Splits at the space or hyphen closest to the middle; hyphens stay on line one.
const splitInTwo = (text: string): string[] | null => {
  let best = -1;
  for (let i = 1; i < text.length - 1; i += 1) {
    const char = text[i];
    if (char !== " " && char !== "-") {
      continue;
    }
    if (best === -1 || Math.abs(i - text.length / 2) < Math.abs(best - text.length / 2)) {
      best = i;
    }
  }
  if (best === -1) {
    return null;
  }
  const cut = text[best] === "-" ? best + 1 : best;
  return [text.slice(0, cut).trim(), text.slice(cut).trim()];
};

/**
 * The biggest font size (stepping down by 2) at which `text` fits `maxWidth`,
 * on one line if possible, else broken into two. Never below `minSize`.
 */
export const fitText = (
  text: string,
  measure: MeasureText,
  maxWidth: number,
  maxSize: number,
  minSize: number,
): FittedText => {
  const two = splitInTwo(text);
  const fits = (lines: readonly string[], size: number): boolean =>
    lines.every((line) => measure(line, size) <= maxWidth);
  for (let size = maxSize; size >= minSize; size -= 2) {
    if (fits([text], size)) {
      return { lines: [text], fontSize: size };
    }
    // Two lines only once one line would get really small.
    if (two !== null && size <= maxSize * 0.75 && fits(two, size)) {
      return { lines: two, fontSize: size };
    }
  }
  return { lines: two ?? [text], fontSize: minSize };
};

interface QuaternionLike {
  x: number;
  y: number;
  z: number;
  w: number;
}

// Beyond this tilt (≈ 55°) it is lying, not wobbling.
const LYING_UP_Y = Math.cos((55 * Math.PI) / 180);

/** True when the standee's up axis has tipped too far — it is down. */
export const isKnockedOver = (rotation: QuaternionLike): boolean => {
  // y component of the body's local up axis in world space.
  const upY = 1 - 2 * (rotation.x * rotation.x + rotation.z * rotation.z);
  return upY < LYING_UP_Y;
};

// Speech bubble lines. Pools — pick with `pickLine` from "@/lib/funny-lines".
export const mascotCopy = {
  ouch: ["AUA!", "AUTSCH!", "HEY!", "UFF!", "NICHT INS GESICHT!", "ZIELEN, CHEF!", "MEIN FELL!"],
  down: ["K.O.!", "ICH LIEG GUT!", "BIS GLEICH …", "MAYDAY!", "SANI!"],
  up: ["GEHT SCHON!", "NIX PASSIERT!", "NOCHMAL!", "ICH STEH!", "WAR NIX!"],
} as const;
