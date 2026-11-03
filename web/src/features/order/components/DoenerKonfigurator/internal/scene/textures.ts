import { CanvasTexture, RepeatWrapping, SRGBColorSpace, type Texture } from "three";
import { createRandom } from "./random";

// Procedural textures, painted once into canvases at startup. No image assets:
// nothing to download, nothing to license, and every crumb is ours.

type Painter = (u: number, v: number) => readonly [number, number, number];

const smooth = (t: number): number => t * t * (3 - 2 * t);

// Tileable value noise with `cells` lattice cells across each axis.
const createNoise = (
  cellsX: number,
  cellsY: number,
  seed: number,
): ((u: number, v: number) => number) => {
  const random = createRandom(seed);
  const lattice = Array.from({ length: cellsX * cellsY }, () => random());
  const at = (x: number, y: number): number =>
    lattice[(((y % cellsY) + cellsY) % cellsY) * cellsX + (((x % cellsX) + cellsX) % cellsX)] ?? 0;
  return (u: number, v: number): number => {
    const x = u * cellsX;
    const y = v * cellsY;
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = smooth(x - x0);
    const fy = smooth(y - y0);
    const top = at(x0, y0) * (1 - fx) + at(x0 + 1, y0) * fx;
    const bottom = at(x0, y0 + 1) * (1 - fx) + at(x0 + 1, y0 + 1) * fx;
    return top * (1 - fy) + bottom * fy;
  };
};

// Fractal noise: four octaves of value noise, normalized to roughly 0..1.
const createFbm = (
  cellsX: number,
  cellsY: number,
  seed: number,
): ((u: number, v: number) => number) => {
  const octaves = [0, 1, 2, 3].map((octave) =>
    createNoise(cellsX * 2 ** octave, cellsY * 2 ** octave, seed + octave * 101),
  );
  return (u: number, v: number): number => {
    let sum = 0;
    let weight = 0.5;
    for (const octave of octaves) {
      sum += octave(u, v) * weight;
      weight *= 0.5;
    }
    return sum / 0.9375;
  };
};

const paint = (width: number, height: number, painter: Painter, srgb: boolean): Texture => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (context !== null) {
    const image = context.createImageData(width, height);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const [r, g, b] = painter(x / width, y / height);
        const offset = (y * width + x) * 4;
        image.data[offset] = r * 255;
        image.data[offset + 1] = g * 255;
        image.data[offset + 2] = b * 255;
        image.data[offset + 3] = 255;
      }
    }
    context.putImageData(image, 0, 0);
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.anisotropy = 4;
  if (srgb) {
    texture.colorSpace = SRGBColorSpace;
  }
  return texture;
};

type Rgb = [number, number, number];

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value));
const gray = (value: number): Rgb => [value, value, value];
// sRGB components 0..1 — painted straight into the canvas, no color management.
const rgb = (hex: string): Rgb => {
  const value = Number.parseInt(hex.slice(1), 16);
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
};
const mix = (a: Rgb, b: Rgb, t: number): Rgb => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

export interface SurfaceTextures {
  map: Texture;
  bumpMap: Texture;
}

// Grill-toasted Fladenbrot crust: golden base, darker blisters, a few burnt
// spots and flour dust.
export const createCrustTextures = (): SurfaceTextures => {
  const body = createFbm(8, 4, 11);
  const blisters = createFbm(24, 12, 23);
  const char = createFbm(5, 3, 37);
  const dust = createNoise(220, 110, 41);
  const light = rgb("#F6D29A");
  const dark = rgb("#CF8A45");
  const burnt = rgb("#6B3A1A");
  const flour = rgb("#F6EBD3");
  const map = paint(
    512,
    256,
    (u, v) => {
      const toast = clamp01(body(u, v) * 1.1 - 0.35 + blisters(u, v) * 0.3);
      const toasted = mix(mix(light, dark, toast), burnt, clamp01((char(u, v) - 0.74) * 3));
      return dust(u, v) > 0.83 ? mix(toasted, flour, 0.55) : toasted;
    },
    true,
  );
  const bumpMap = paint(512, 256, (u, v) => gray(blisters(u, v) * 0.7 + body(u, v) * 0.3), false);
  return { map, bumpMap };
};

// Airy crumb for the inside of the pocket: pale with dark pores.
export const createCrumbTextures = (): SurfaceTextures => {
  const pores = createFbm(40, 20, 53);
  const fine = createFbm(30, 15, 59);
  // Soft-edged pores: a smooth ramp instead of a hard threshold (no pixel blocks).
  const pore = (u: number, v: number): number => smooth(clamp01((pores(u, v) - 0.6) * 6));
  const map = paint(
    512,
    256,
    (u, v) => {
      const shade = (0.92 + fine(u, v) * 0.08) * (1 - pore(u, v) * 0.22);
      return [0.96 * shade, 0.87 * shade, 0.7 * shade];
    },
    true,
  );
  const bumpMap = paint(512, 256, (u, v) => gray(0.7 - pore(u, v) * 0.5 + fine(u, v) * 0.2), false);
  return { map, bumpMap };
};

// Shaved Dönerfleisch: long fibers with charred, crispy edges. Gray so the
// per-piece instance color decides Kalb vs. Hähnchen.
export const createMeatTextures = (): SurfaceTextures => {
  const fibers = createFbm(3, 40, 67);
  const crisp = createFbm(12, 4, 71);
  const tone = (u: number, v: number): number => {
    const edge = Math.min(u, 1 - u, v * 0.6, (1 - v) * 0.6);
    const burnt = clamp01(0.18 - edge) * 4 * crisp(u, v);
    return clamp01(0.6 + fibers(u, v) * 0.5 - burnt * 0.7);
  };
  const map = paint(256, 64, (u, v) => gray(tone(u, v)), true);
  const bumpMap = paint(256, 64, (u, v) => gray(fibers(u, v)), false);
  return { map, bumpMap };
};

// Salad leaf: lighter veins over a slightly mottled leaf.
export const createLeafTextures = (): SurfaceTextures => {
  const mottle = createFbm(6, 6, 79);
  const vein = (u: number, v: number): number => {
    const center = Math.abs(v - 0.5);
    const side = Math.abs(((u * 6 + center * 4) % 1) - 0.5);
    return Math.max(clamp01(1 - center * 28), clamp01(1 - side * 14) * clamp01(1 - center * 2.2));
  };
  const map = paint(
    128,
    128,
    (u, v) => gray(clamp01(0.78 + mottle(u, v) * 0.2 + vein(u, v) * 0.25)),
    true,
  );
  const bumpMap = paint(
    128,
    128,
    (u, v) => gray(clamp01(0.5 + vein(u, v) * 0.5 - mottle(u, v) * 0.2)),
    false,
  );
  return { map, bumpMap };
};

const radial = (u: number, v: number): { r: number; angle: number } => {
  const x = u * 2 - 1;
  const y = v * 2 - 1;
  return { r: Math.sqrt(x * x + y * y), angle: Math.atan2(y, x) };
};

// Tomato slice: deep red skin, red walls, three gel chambers full of seeds.
export const createTomatoTextures = (): SurfaceTextures => {
  const seeds = createNoise(40, 40, 83);
  const skin = rgb("#B3160C");
  const wall = rgb("#E0402A");
  const gel = rgb("#F0A24A");
  const core = rgb("#F2B7A0");
  const seed = rgb("#F5E59E");
  const sample = (u: number, v: number): Rgb => {
    const { r, angle } = radial(u, v);
    if (r > 0.9) {
      return skin;
    }
    if (r < 0.18) {
      return core;
    }
    const sector = Math.abs(Math.sin(angle * 1.5));
    if (r > 0.3 && r < 0.78 && sector > 0.35) {
      return seeds(u, v) > 0.7 ? seed : gel;
    }
    return wall;
  };
  const map = paint(128, 128, sample, true);
  const bumpMap = paint(
    128,
    128,
    (u, v) => gray(radial(u, v).r > 0.9 ? 0.9 : seeds(u, v) * 0.5),
    false,
  );
  return { map, bumpMap };
};

// Cucumber slice: dark green rind, pale flesh, a ring of seeds.
export const createCucumberTextures = (): SurfaceTextures => {
  const seeds = createNoise(36, 36, 89);
  const sample = (u: number, v: number): Rgb => {
    const { r } = radial(u, v);
    if (r > 0.9) {
      return [0.12, 0.3, 0.1];
    }
    if (r > 0.25 && r < 0.5 && seeds(u, v) > 0.66) {
      return [0.93, 0.95, 0.82];
    }
    const flesh = 0.82 + (1 - r) * 0.12;
    return [0.72 * flesh, 0.88 * flesh, 0.6 * flesh];
  };
  const map = paint(128, 128, sample, true);
  const bumpMap = paint(128, 128, (u, v) => gray(radial(u, v).r > 0.9 ? 0.8 : 0.4), false);
  return { map, bumpMap };
};

// Kraft Döner paper with a stamped emblem: a ring with the lettering around it
// and a Drehspieß in the middle. The print sits on the standing part.
export const createPaperTexture = (ink: string, label: string): Texture => {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (context !== null) {
    context.fillStyle = "#D2AE7C";
    context.fillRect(0, 0, size, size);
    const random = createRandom(97);
    for (let i = 0; i < 2600; i += 1) {
      const shade = random() < 0.5 ? "90, 60, 30" : "255, 240, 210";
      context.fillStyle = `rgba(${shade}, ${random() * 0.08})`;
      context.fillRect(random() * size, random() * size, 1 + random() * 4, 1);
    }
    // Canvas top = paper's upper (standing) end, thanks to flipY.
    const cx = size / 2;
    const cy = size * 0.24;
    const radius = 84;
    context.globalAlpha = 0.72;
    context.strokeStyle = ink;
    context.fillStyle = ink;
    context.lineWidth = 5;
    context.beginPath();
    context.arc(cx, cy, radius, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.arc(cx, cy, radius - 34, 0, Math.PI * 2);
    context.stroke();
    // Lettering around the ring.
    context.font = "bold 22px sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    const letters = [...label];
    letters.forEach((letter, index) => {
      const angle = -Math.PI / 2 + ((index + 0.5) / letters.length) * Math.PI * 2;
      context.save();
      context.translate(cx + Math.cos(angle) * (radius - 17), cy + Math.sin(angle) * (radius - 17));
      context.rotate(angle + Math.PI / 2);
      context.fillText(letter, 0, 0);
      context.restore();
    });
    // A little Drehspieß: a cone of meat on a skewer.
    context.beginPath();
    context.moveTo(cx - 20, cy - 26);
    context.lineTo(cx + 20, cy - 26);
    context.lineTo(cx + 10, cy + 24);
    context.lineTo(cx - 10, cy + 24);
    context.closePath();
    context.fill();
    context.fillRect(cx - 2, cy - 40, 4, 76);
    context.globalAlpha = 1;
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
};
