import { useFrame, useThree } from "@react-three/fiber";
import { type FC, useEffect, useRef } from "react";

interface ShadowUpdaterProps {
  /** Changes whenever something is thrown in or out. */
  activity: string;
}

// Throws plus settling take well under this; afterwards nothing moves.
const SETTLE_MS = 4500;

// The key light never moves, so the shadow map only has to be re-rendered
// while pieces are flying or settling — not every frame forever.
export const ShadowUpdater: FC<ShadowUpdaterProps> = ({ activity }) => {
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
    if (now - lastActivity.current < SETTLE_MS) {
      gl.shadowMap.needsUpdate = true;
    }
  });

  return null;
};
