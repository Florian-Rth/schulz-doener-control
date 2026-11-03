import {
  BoxGeometry,
  type BufferGeometry,
  CylinderGeometry,
  PlaneGeometry,
  TorusGeometry,
} from "three";
import type { PieceShape } from "./food";

// Bends a flat piece along x so meat strips and leaves are not perfectly flat.
const bend = (geometry: BufferGeometry, amount: number, wobble: number): BufferGeometry => {
  const position = geometry.getAttribute("position");
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const z = position.getZ(i);
    position.setY(i, position.getY(i) + amount * x * x + wobble * Math.sin(x * 23 + z * 17));
  }
  geometry.computeVertexNormals();
  return geometry;
};

// Twists a strip around its long axis: shaved Dönerfleisch curls as it is cut.
const twist = (geometry: BufferGeometry, turns: number): BufferGeometry => {
  const position = geometry.getAttribute("position");
  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const angle = x * turns;
    position.setY(i, y * Math.cos(angle) - z * Math.sin(angle));
    position.setZ(i, y * Math.sin(angle) + z * Math.cos(angle));
  }
  geometry.computeVertexNormals();
  return geometry;
};

// Pieces are oversized on purpose: at real scale the filling would vanish in
// the gap. Meat and salad stay closer to real size (big flat ones looked like
// planks and paper sheets). Every shape gets an auto cuboid collider.
const PIECE_SCALE: Record<PieceShape, number> = {
  strip: 1,
  leaf: 1,
  halfSlice: 1.25,
  slice: 1.25,
  ring: 1.2,
  shred: 1.2,
};

export const createPieceGeometry = (shape: PieceShape): BufferGeometry => {
  const scale = PIECE_SCALE[shape];
  return createBasePiece(shape).scale(scale, scale, scale);
};

const createBasePiece = (shape: PieceShape): BufferGeometry => {
  switch (shape) {
    case "strip":
      return twist(bend(new BoxGeometry(0.44, 0.035, 0.17, 12, 1, 4), 1.6, 0.012), 2.4);
    case "leaf": {
      const leaf = new PlaneGeometry(0.46, 0.34, 8, 6);
      leaf.rotateX(-Math.PI / 2);
      return bend(leaf, 0.9, 0.025);
    }
    case "halfSlice":
      return new CylinderGeometry(0.2, 0.2, 0.05, 24, 1, false, 0, Math.PI);
    case "slice":
      return new CylinderGeometry(0.15, 0.15, 0.045, 24);
    case "ring": {
      const ring = new TorusGeometry(0.13, 0.024, 8, 24);
      ring.rotateX(Math.PI / 2);
      return ring;
    }
    case "shred":
      return bend(new BoxGeometry(0.4, 0.028, 0.045, 8, 1, 1), 0.6, 0.005);
  }
};
