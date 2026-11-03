import type { SurfaceKind } from "./food";
import {
  createCucumberTextures,
  createLeafTextures,
  createMeatTextures,
  createTomatoTextures,
  type SurfaceTextures,
} from "./textures";

const cache = new Map<SurfaceKind, SurfaceTextures | null>();

const create = (kind: SurfaceKind): SurfaceTextures | null => {
  switch (kind) {
    case "meat":
      return createMeatTextures();
    case "leaf":
      return createLeafTextures();
    case "tomato":
      return createTomatoTextures();
    case "cucumber":
      return createCucumberTextures();
    case "plain":
      return null;
  }
};

// Textures are painted once and shared by every volley of that ingredient.
export const surfaceTextures = (kind: SurfaceKind): SurfaceTextures | null => {
  const cached = cache.get(kind);
  if (cached !== undefined) {
    return cached;
  }
  const created = create(kind);
  cache.set(kind, created);
  return created;
};
