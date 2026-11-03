import { CanvasTexture, SRGBColorSpace } from "three";
import { fitText, type MeasureText, splitTierName } from "../../mascot";
import { createRandom } from "./random";

// Canvas paintings for the cardboard standee: the die-cut front (Tier emoji
// with a white sticker outline and a name plate), the kraft back and the
// comic speech bubble. Painted once (bubble: on every new line), never per frame.

/** Canvas size of the standee, also its aspect ratio in the scene. */
export const CARD_WIDTH = 512;
export const CARD_HEIGHT = 640;

// Material colours of the cardboard (3D-only, like the bread colours in food.ts).
export const CARDBOARD = {
  kraft: "#C9A272",
  kraftDark: "#8E6B42",
  outline: "#FFFFFF",
} as const;

const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
const EMOJI_SIZE = 330;
const EMOJI_CENTER_Y = 250;
const OUTLINE = 20;
const PLATE = { x: 46, y: 452, width: 420, height: 150, radius: 26 } as const;

interface CardStyle {
  emoji: string;
  name: string;
  /** Plate colour (the theme's primary red). */
  ink: string;
  /** Plate lettering. */
  inkText: string;
  fontFamily: string;
}

const canvasOf = (width: number, height: number): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

const roundedRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void => {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
};

// The emoji on its own canvas: the colour glyph and, separately, its solid silhouette.
const paintGlyph = (emoji: string): { glyph: HTMLCanvasElement; mask: HTMLCanvasElement } => {
  const glyph = canvasOf(CARD_WIDTH, CARD_HEIGHT);
  const mask = canvasOf(CARD_WIDTH, CARD_HEIGHT);
  const context = glyph.getContext("2d");
  const maskContext = mask.getContext("2d");
  if (context === null || maskContext === null) {
    return { glyph, mask };
  }
  context.font = `${EMOJI_SIZE}px ${EMOJI_FONT}`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(emoji, CARD_WIDTH / 2, EMOJI_CENTER_Y);
  maskContext.drawImage(glyph, 0, 0);
  maskContext.globalCompositeOperation = "source-in";
  maskContext.fillStyle = "#FFFFFF";
  maskContext.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  return { glyph, mask };
};

// The die-cut outline: the glyph silhouette grown by `grow`, plus the name
// plate and a bridge between them, all filled with `color`.
const paintSilhouette = (
  context: CanvasRenderingContext2D,
  mask: HTMLCanvasElement,
  grow: number,
  color: string,
): void => {
  const layer = canvasOf(CARD_WIDTH, CARD_HEIGHT);
  const layerContext = layer.getContext("2d");
  if (layerContext === null) {
    return;
  }
  const steps = 24;
  for (let i = 0; i < steps; i += 1) {
    const angle = (i / steps) * Math.PI * 2;
    layerContext.drawImage(mask, Math.cos(angle) * grow, Math.sin(angle) * grow);
  }
  layerContext.fillStyle = "#FFFFFF";
  // Bridge from the figure down to the plate, so it is one piece of cardboard.
  layerContext.fillRect(CARD_WIDTH / 2 - 70, EMOJI_CENTER_Y + 60, 140, PLATE.y - EMOJI_CENTER_Y);
  roundedRect(
    layerContext,
    PLATE.x - grow,
    PLATE.y - grow,
    PLATE.width + grow * 2,
    PLATE.height + grow * 2,
    PLATE.radius + grow,
  );
  layerContext.fill();
  layerContext.globalCompositeOperation = "source-in";
  layerContext.fillStyle = color;
  layerContext.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  context.drawImage(layer, 0, 0);
};

const measureWith =
  (context: CanvasRenderingContext2D, weight: number, fontFamily: string): MeasureText =>
  (text: string, fontSize: number): number => {
    context.font = `${weight} ${fontSize}px ${fontFamily}`;
    return context.measureText(text).width;
  };

const paintPlate = (context: CanvasRenderingContext2D, style: CardStyle): void => {
  roundedRect(context, PLATE.x, PLATE.y, PLATE.width, PLATE.height, PLATE.radius);
  context.fillStyle = style.ink;
  context.fill();
  const { article, title } = splitTierName(style.name);
  const fitted = fitText(
    title,
    measureWith(context, 800, style.fontFamily),
    PLATE.width - 40,
    58,
    26,
  );
  const articleSize = 30;
  const lineHeight = fitted.fontSize * 1.08;
  const block = (article === null ? 0 : articleSize * 1.1) + lineHeight * fitted.lines.length;
  let y = PLATE.y + (PLATE.height - block) / 2;
  context.fillStyle = style.inkText;
  context.textAlign = "center";
  context.textBaseline = "top";
  if (article !== null) {
    context.font = `600 ${articleSize}px ${style.fontFamily}`;
    context.fillText(article.toUpperCase(), CARD_WIDTH / 2, y);
    y += articleSize * 1.1;
  }
  context.font = `800 ${fitted.fontSize}px ${style.fontFamily}`;
  for (const line of fitted.lines) {
    context.fillText(line, CARD_WIDTH / 2, y);
    y += lineHeight;
  }
};

/** Repaints the front of the standee into `canvas`. */
const paintFront = (canvas: HTMLCanvasElement, style: CardStyle): void => {
  const context = canvas.getContext("2d");
  if (context === null) {
    return;
  }
  context.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  const { glyph, mask } = paintGlyph(style.emoji);
  // A thin brown rim = the cut cardboard edge, then the white sticker border.
  paintSilhouette(context, mask, OUTLINE + 5, CARDBOARD.kraftDark);
  paintSilhouette(context, mask, OUTLINE, CARDBOARD.outline);
  context.drawImage(glyph, 0, 0);
  paintPlate(context, style);
};

/** Repaints the plain kraft back (same silhouette, so the cut matches). */
const paintBack = (canvas: HTMLCanvasElement, style: CardStyle): void => {
  const context = canvas.getContext("2d");
  if (context === null) {
    return;
  }
  context.clearRect(0, 0, CARD_WIDTH, CARD_HEIGHT);
  const { mask } = paintGlyph(style.emoji);
  paintSilhouette(context, mask, OUTLINE + 5, CARDBOARD.kraft);
  context.globalCompositeOperation = "source-atop";
  const random = createRandom(31);
  for (let i = 0; i < 1800; i += 1) {
    const shade = random() < 0.5 ? "90, 60, 30" : "255, 240, 210";
    context.fillStyle = `rgba(${shade}, ${random() * 0.1})`;
    context.fillRect(random() * CARD_WIDTH, random() * CARD_HEIGHT, 2 + random() * 6, 1);
  }
  // Seen from behind, so the stamp is mirrored on the canvas to read right.
  context.save();
  context.translate(CARD_WIDTH / 2, PLATE.y + PLATE.height / 2);
  context.scale(-1, 1);
  context.fillStyle = CARDBOARD.kraftDark;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `800 34px ${style.fontFamily}`;
  context.fillText("SCHULZ · AUFSTELLER", 0, 0);
  context.restore();
  context.globalCompositeOperation = "source-over";
};

export interface StandeeTextures {
  front: CanvasTexture;
  back: CanvasTexture;
  /** Paints again, e.g. once the web font has loaded. */
  repaint: () => void;
}

const textureOf = (canvas: HTMLCanvasElement): CanvasTexture => {
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
};

export const createStandeeTextures = (style: CardStyle): StandeeTextures => {
  const frontCanvas = canvasOf(CARD_WIDTH, CARD_HEIGHT);
  const backCanvas = canvasOf(CARD_WIDTH, CARD_HEIGHT);
  const front = textureOf(frontCanvas);
  const back = textureOf(backCanvas);
  const repaint = (): void => {
    paintFront(frontCanvas, style);
    paintBack(backCanvas, style);
    front.needsUpdate = true;
    back.needsUpdate = true;
  };
  repaint();
  return { front, back, repaint };
};

export const BUBBLE_WIDTH = 512;
export const BUBBLE_HEIGHT = 256;

export interface BubbleTexture {
  texture: CanvasTexture;
  /** Paints a new line into the bubble. */
  say: (text: string) => void;
}

interface BubbleStyle {
  ink: string;
  outline: string;
  fontFamily: string;
}

// A comic speech bubble with its tail pointing down at the standee.
export const createBubbleTexture = (style: BubbleStyle): BubbleTexture => {
  const canvas = canvasOf(BUBBLE_WIDTH, BUBBLE_HEIGHT);
  const texture = textureOf(canvas);
  const say = (text: string): void => {
    const context = canvas.getContext("2d");
    if (context === null) {
      return;
    }
    context.clearRect(0, 0, BUBBLE_WIDTH, BUBBLE_HEIGHT);
    context.lineWidth = 10;
    context.lineJoin = "round";
    context.strokeStyle = style.outline;
    context.fillStyle = "#FFFFFF";
    context.beginPath();
    context.roundRect(16, 14, BUBBLE_WIDTH - 32, BUBBLE_HEIGHT - 78, 60);
    context.moveTo(BUBBLE_WIDTH / 2 - 40, BUBBLE_HEIGHT - 66);
    context.lineTo(BUBBLE_WIDTH / 2 - 8, BUBBLE_HEIGHT - 12);
    context.lineTo(BUBBLE_WIDTH / 2 + 26, BUBBLE_HEIGHT - 66);
    context.stroke();
    context.fill();
    const fitted = fitText(
      text,
      measureWith(context, 900, style.fontFamily),
      BUBBLE_WIDTH - 90,
      92,
      34,
    );
    context.fillStyle = style.ink;
    context.font = `italic 900 ${fitted.fontSize}px ${style.fontFamily}`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    const lineHeight = fitted.fontSize * 1.02;
    const middle = (BUBBLE_HEIGHT - 64) / 2 + 14;
    fitted.lines.forEach((line, index) => {
      const offset = (index - (fitted.lines.length - 1) / 2) * lineHeight;
      context.fillText(line, BUBBLE_WIDTH / 2, middle + offset);
    });
    texture.needsUpdate = true;
  };
  say("");
  return { texture, say };
};
