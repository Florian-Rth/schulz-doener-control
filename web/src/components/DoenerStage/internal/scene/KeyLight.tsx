import { type FC, useLayoutEffect, useRef } from "react";
import type { DirectionalLight } from "three";

// The shadow-casting key light. Shadow camera fitted to plate + mess radius.
export const KeyLight: FC = () => {
  const light = useRef<DirectionalLight>(null);

  useLayoutEffect(() => {
    const node = light.current;
    if (node === null) {
      return;
    }
    node.shadow.mapSize.set(1024, 1024);
    node.shadow.bias = -0.0004;
    node.shadow.normalBias = 0.02;
    node.shadow.radius = 4;
    const camera = node.shadow.camera;
    camera.left = -4.5;
    camera.right = 4.5;
    camera.top = 4.5;
    camera.bottom = -4.5;
    camera.near = 0.5;
    camera.far = 20;
    camera.updateProjectionMatrix();
  }, []);

  return <directionalLight ref={light} position={[3, 7, 4]} intensity={2.6} castShadow />;
};
