import { useFrame, useThree } from "@react-three/fiber";
import type { FC, RefObject } from "react";
import { MathUtils } from "three";

interface ImpactShakeProps {
  /** 0..1, raised by hits; decays here. */
  intensity: RefObject<number>;
}

const MAX_ANGLE = 0.035;

// Camera shake on impact. Runs after OrbitControls (which re-aims the camera
// every frame) and only adds a jitter on top — it never takes over the aim,
// unlike a shake that restores a stored rotation.
export const ImpactShake: FC<ImpactShakeProps> = ({ intensity }) => {
  const camera = useThree((state) => state.camera);

  useFrame((state, delta) => {
    intensity.current = MathUtils.damp(intensity.current, 0, 4, delta);
    const shake = intensity.current ** 2;
    if (shake < 0.0001) {
      return;
    }
    const t = state.clock.elapsedTime;
    camera.rotateX(MAX_ANGLE * shake * Math.sin(t * 71 + Math.sin(t * 13)));
    camera.rotateY(MAX_ANGLE * shake * Math.sin(t * 59 + 1.7));
    camera.rotateZ(MAX_ANGLE * 1.3 * shake * Math.sin(t * 47 + 0.4));
  });

  return null;
};
