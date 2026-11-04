import { createContext, type RefObject, useContext } from "react";

// The shadow map is frozen while nothing moves (see ShadowUpdater). Extra
// scene content that moves on its own (a game's flying pieces)
// pokes it, so its shadow follows. The ref holds the last poke (performance.now()).
export const ShadowPokeContext = createContext<RefObject<number> | null>(null);

/** Returns a function that keeps the shadow map updating for a few more seconds. */
export const useShadowPoke = (): (() => void) => {
  const pokes = useContext(ShadowPokeContext);
  if (pokes === null) {
    throw new Error("useShadowPoke must be used inside the DoenerStage scene");
  }
  return (): void => {
    pokes.current = performance.now();
  };
};
