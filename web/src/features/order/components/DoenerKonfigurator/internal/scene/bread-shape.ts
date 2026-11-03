import { BufferGeometry, Float32BufferAttribute, SphereGeometry, Vector3 } from "three";
import { BREAD } from "./pocket";
import { createRandom } from "./random";

// Geometry for the lying Döner. Each slab is a "pillow": a superellipsoid —
// boxy in plan view like a Pide, domed on top — split at its equator into the
// crust half and the (much flatter) cut face that shows the crumb.

export type Slab = "bottom" | "lid";
export type Half = "crust" | "crumb";

const signedPow = (value: number, exponent: number): number =>
  Math.sign(value) * Math.abs(value) ** exponent;

// Low-frequency lumps so the crust looks baked rather than machined.
const lumps = (x: number, z: number): number =>
  0.022 * Math.sin(3.1 * x + 1.3) * Math.sin(4.2 * z + 0.7) + 0.01 * Math.sin(9 * x + z * 7);

const HINGE_Z = -BREAD.halfDepth * 0.96;

const lidRotation = { cos: Math.cos(-BREAD.lidAngle), sin: Math.sin(-BREAD.lidAngle) };

/**
 * Maps a unit-sphere direction onto one slab surface, in bread-local space.
 * The lid is built flat and then swung open around the hinge at the back.
 */
export const slabPoint = (slab: Slab, half: Half, direction: Vector3, target: Vector3): Vector3 => {
  const x = signedPow(direction.x, 0.45) * BREAD.halfLength;
  const z = signedPow(direction.z, 0.6) * BREAD.halfDepth;
  const edge = Math.max(Math.abs(direction.x), Math.abs(direction.z));
  const crustBump = half === "crust" ? lumps(x, z) * (1 - edge) : 0;

  if (slab === "bottom") {
    const radius = half === "crust" ? BREAD.bottomCrust : BREAD.bottomCrumb;
    return target.set(x, BREAD.bottomCrust + direction.y * (radius + crustBump), z);
  }

  // Lid, closed: its cut face rests on the bottom slab's cut face.
  const radius = half === "crust" ? BREAD.lidCrust : BREAD.lidCrumb;
  const closedY =
    BREAD.bottomCrust + BREAD.bottomCrumb + BREAD.lidCrumb + direction.y * (radius + crustBump);
  // Swing it open around the hinge line (x axis through y = filling floor, z = HINGE_Z).
  const pivotY = BREAD.bottomCrust + BREAD.bottomCrumb;
  const relY = closedY - pivotY;
  const relZ = z * 0.98 - HINGE_Z;
  return target.set(
    x * 0.98,
    pivotY + relY * lidRotation.cos - relZ * lidRotation.sin,
    HINGE_Z + relY * lidRotation.sin + relZ * lidRotation.cos,
  );
};

/** One half of one slab as a mesh. The crust half points up on the lid and down on the bottom. */
export const createSlabHalf = (
  slab: Slab,
  half: Half,
  widthSegments: number,
  heightSegments: number,
): BufferGeometry => {
  const up = (slab === "lid") === (half === "crust");
  const geometry = new SphereGeometry(
    1,
    widthSegments,
    heightSegments,
    0,
    Math.PI * 2,
    up ? 0 : Math.PI / 2,
    Math.PI / 2,
  );
  const position = geometry.getAttribute("position");
  const direction = new Vector3();
  const point = new Vector3();
  for (let i = 0; i < position.count; i += 1) {
    direction.set(position.getX(i), position.getY(i), position.getZ(i));
    slabPoint(slab, half, direction, point);
    position.setXYZ(i, point.x, point.y, point.z);
  }
  geometry.computeVertexNormals();
  return geometry;
};

/** Convex hull points of a whole slab (both halves) for its physics collider. */
export const createSlabHull = (slab: Slab): Float32Array => {
  const points: number[] = [];
  const direction = new Vector3();
  const point = new Vector3();
  for (let j = 0; j <= 8; j += 1) {
    const theta = (j / 8) * Math.PI;
    for (let i = 0; i < 16; i += 1) {
      const phi = (i / 16) * Math.PI * 2;
      direction.setFromSphericalCoords(1, theta, phi);
      const half: Half = direction.y >= 0 === (slab === "lid") ? "crust" : "crumb";
      slabPoint(slab, half, direction, point);
      points.push(point.x, point.y, point.z);
    }
  }
  return Float32Array.from(points);
};

export interface SeedPlacement {
  position: Vector3;
  normal: Vector3;
}

// Sesame and nigella seeds all over the lid's crust, like a proper Fladenbrot.
export const placeSeeds = (count: number, seed: number): SeedPlacement[] => {
  const random = createRandom(seed);
  const direction = new Vector3();
  const a = new Vector3();
  const b = new Vector3();
  const c = new Vector3();
  const d = new Vector3();
  const epsilon = 0.01;
  return Array.from({ length: count }, (): SeedPlacement => {
    const theta = Math.acos(1 - random() * 0.82);
    const phi = random() * Math.PI * 2;
    direction.setFromSphericalCoords(1, theta, phi);
    const position = slabPoint("lid", "crust", direction, new Vector3());
    slabPoint("lid", "crust", direction.setFromSphericalCoords(1, theta + epsilon, phi), a);
    slabPoint("lid", "crust", direction.setFromSphericalCoords(1, theta - epsilon, phi), b);
    slabPoint("lid", "crust", direction.setFromSphericalCoords(1, theta, phi + epsilon), c);
    slabPoint("lid", "crust", direction.setFromSphericalCoords(1, theta, phi - epsilon), d);
    const normal = c.sub(d).cross(a.sub(b)).normalize();
    if (normal.y < 0) {
      normal.negate();
    }
    return { position: position.addScaledVector(normal, 0.01), normal };
  });
};

// The kraft paper: flat under the Döner, then curving up into a sheet that
// stands behind it (and catches overshooting throws).
export const PAPER = {
  halfWidth: 2.05,
  front: 1.3,
  back: -1.12,
  bendRadius: 0.35,
  rise: 1.7,
  /** Backwards lean of the standing part. */
  lean: 0.18,
} as const;

const paperProfile = (distance: number): { y: number; z: number } => {
  const flat = PAPER.front - PAPER.back;
  if (distance <= flat) {
    return { y: 0.006, z: PAPER.front - distance };
  }
  const arcLength = (Math.PI / 2 - PAPER.lean) * PAPER.bendRadius;
  if (distance <= flat + arcLength) {
    const angle = (distance - flat) / PAPER.bendRadius;
    return {
      y: 0.006 + PAPER.bendRadius * (1 - Math.cos(angle)),
      z: PAPER.back - PAPER.bendRadius * Math.sin(angle),
    };
  }
  const end = Math.PI / 2 - PAPER.lean;
  const rest = distance - flat - arcLength;
  return {
    y: 0.006 + PAPER.bendRadius * (1 - Math.cos(end)) + rest * Math.cos(PAPER.lean),
    z: PAPER.back - PAPER.bendRadius * Math.sin(end) - rest * Math.sin(PAPER.lean),
  };
};

export const createPaper = (segmentsX: number, segmentsLength: number): BufferGeometry => {
  const total =
    PAPER.front - PAPER.back + (Math.PI / 2 - PAPER.lean) * PAPER.bendRadius + PAPER.rise;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let j = 0; j <= segmentsLength; j += 1) {
    const v = j / segmentsLength;
    const { y, z } = paperProfile(v * total);
    for (let i = 0; i <= segmentsX; i += 1) {
      const u = i / segmentsX;
      const x = (u * 2 - 1) * PAPER.halfWidth;
      // Crumpled a little, more towards the free top edge.
      const crumple = 0.025 * Math.sin(x * 5.3 + v * 9) * Math.sin(v * 14 + x) * v;
      positions.push(x, y + (v > 0.5 ? 0 : crumple * 0.2), z + (v > 0.5 ? crumple : 0));
      uvs.push(u, v);
    }
  }
  const row = segmentsX + 1;
  for (let j = 0; j < segmentsLength; j += 1) {
    for (let i = 0; i < segmentsX; i += 1) {
      const a = j * row + i;
      indices.push(a, a + row, a + 1, a + 1, a + row, a + row + 1);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
};

/** Where the standing part of the paper is, for a thin wall collider. */
export const paperWall = (): { center: [number, number, number]; tilt: number } => {
  const end = Math.PI / 2 - PAPER.lean;
  const baseY = 0.006 + PAPER.bendRadius * (1 - Math.cos(end));
  const baseZ = PAPER.back - PAPER.bendRadius * Math.sin(end);
  return {
    center: [
      0,
      baseY + (PAPER.rise / 2) * Math.cos(PAPER.lean),
      baseZ - (PAPER.rise / 2) * Math.sin(PAPER.lean),
    ],
    tilt: -PAPER.lean,
  };
};
