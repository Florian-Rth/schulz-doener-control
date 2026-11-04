import { type IngredientSpec, meatSpec, VEGGIE_SPECS } from "@/components/DoenerStage/three";
import type { PieceKind } from "../../../../scoring";

// The look of every throwable piece: the same ingredients as in the Döner.
export const PIECE_SPECS: Record<PieceKind, IngredientSpec> = {
  fleisch: meatSpec("kalb"),
  tomate: VEGGIE_SPECS.tomate,
  gurke: VEGGIE_SPECS.gurke,
  zwiebel: VEGGIE_SPECS.zwiebeln,
  salat: VEGGIE_SPECS.salat,
  rotkohl: VEGGIE_SPECS.rotkohl,
};
