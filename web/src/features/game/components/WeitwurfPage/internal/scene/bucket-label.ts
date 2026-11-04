import { CanvasTexture, SRGBColorSpace } from "three";

export const BUCKET_LABEL_ASPECT = 256 / 176;

// The floating sign over a bucket: its points big, its name small, on a pill
// in the bucket's colour. Painted once per bucket.
export const createBucketLabel = (points: number, name: string, color: string): CanvasTexture => {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 176;
  const context = canvas.getContext("2d");
  if (context !== null) {
    context.fillStyle = color;
    context.beginPath();
    context.roundRect(8, 8, 240, 160, 36);
    context.fill();
    context.fillStyle = "#FFFFFF";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.font = "900 92px system-ui, sans-serif";
    context.fillText(String(points), 128, 74);
    context.font = "700 30px system-ui, sans-serif";
    context.fillText(name, 128, 138, 220);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
};
