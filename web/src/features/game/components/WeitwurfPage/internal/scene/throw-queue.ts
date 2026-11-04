import type { PieceKind } from "../../../../scoring";

/** One throw waiting for its pool to launch it on the next frame. */
export interface PendingThrow {
  spawn: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  spin: { x: number; y: number; z: number };
}

export type ThrowQueues = Record<PieceKind, PendingThrow[]>;

export const createThrowQueues = (): ThrowQueues => ({
  fleisch: [],
  tomate: [],
  gurke: [],
  zwiebel: [],
  salat: [],
  rotkohl: [],
});
