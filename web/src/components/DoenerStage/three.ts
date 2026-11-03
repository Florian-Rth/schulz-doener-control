// The 3D toolkit behind the Döner stage, for extra scene content passed as
// `<DoenerStage>` children (mascots, games …).
//
// Import this ONLY from modules that are themselves loaded lazily
// (`React.lazy(() => import(...))`) — it pulls in three.js and Rapier, which
// must never land in the main bundle.

export { BREAD_BODY_NAME } from "./internal/scene/Bread";
export {
  type IngredientSpec,
  meatSpec,
  type PieceShape,
  sauceColor,
  VEGGIE_SPECS,
} from "./internal/scene/food";
export { createPieceGeometry } from "./internal/scene/geometries";
export { GRAVITY } from "./internal/scene/physics";
export {
  BREAD,
  breadToWorld,
  FILLING_FLOOR_Y,
  FLOOR_Y,
  gapMiddleY,
  PLATE_RADIUS,
  PLATE_Y,
} from "./internal/scene/pocket";
export { createRandom } from "./internal/scene/random";
export { physicsDelta, SETTLE_CHECK_SECONDS } from "./internal/scene/settle";
export { useShadowPoke } from "./internal/scene/shadow-poke-context";
export { surfaceTextures } from "./internal/scene/surfaces";
