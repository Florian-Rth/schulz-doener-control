import { useState } from "react";

interface VolleyState {
  generation: number;
  wasActive: boolean;
  /** Has this ingredient ever gone into the bread? */
  used: boolean;
}

// Volleys are mounted from the start (parked, out of sight) so their shaders
// and textures are ready before the first throw — no hitch on "Ja". The first
// activation throws that pre-mounted volley; every later one bumps the
// generation, which remounts a fresh volley to throw again.
// Render-phase update, so there is no extra commit.
export const useVolleyGeneration = (active: boolean): number => {
  const [state, setState] = useState<VolleyState>({
    generation: 1,
    wasActive: active,
    used: active,
  });
  if (active !== state.wasActive) {
    setState({
      generation: active && state.used ? state.generation + 1 : state.generation,
      wasActive: active,
      used: state.used || active,
    });
  }
  return state.generation;
};
