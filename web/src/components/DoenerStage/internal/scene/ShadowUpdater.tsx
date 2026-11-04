import { useFrame, useThree } from "@react-three/fiber";
import { type FC, type RefObject, useEffect, useRef } from "react";

interface ShadowUpdaterProps {
  /** Changes whenever something is thrown in or out. */
  activity: string;
  /** Last poke from scene content that moves on its own (performance.now()). */
  pokes?: RefObject<number>;
}

// Throws plus settling take well under this; afterwards nothing moves.
const SETTLE_MS = 4500;

// The key light never moves, so the shadow map only has to be re-rendered
// while pieces are flying or settling — not every frame forever.
export const ShadowUpdater: FC<ShadowUpdaterProps> = ({ activity, pokes }) => {
  const gl = useThree((state) => state.gl);
  const seen = useRef<string | null>(null);
  const lastActivity = useRef(0);

  useEffect(() => {
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    return () => {
      gl.shadowMap.autoUpdate = true;
    };
  }, [gl]);

  useFrame(() => {
    const now = performance.now();
    if (seen.current !== activity) {
      seen.current = activity;
      lastActivity.current = now;
    }
    if (now - Math.max(lastActivity.current, pokes?.current ?? 0) < SETTLE_MS) {
      gl.shadowMap.needsUpdate = true;
    }
  });

  return null;
};
