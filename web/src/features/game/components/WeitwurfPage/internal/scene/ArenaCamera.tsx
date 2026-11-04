import { useThree } from "@react-three/fiber";
import { type FC, useLayoutEffect, useState } from "react";
import { Vector3 } from "three";
import { ARENA_FIELD_OF_VIEW, ARENA_TARGET, arenaCameraPosition } from "./arena";

// Puts the camera behind the thrower, looking down the bucket field. Re-fits
// when the canvas changes shape (phone rotated, window resized).
export const ArenaCamera: FC = () => {
  const camera = useThree((state) => state.camera);
  const aspect = useThree((state) => state.size.width / Math.max(1, state.size.height));
  const [scratch] = useState(() => new Vector3());

  useLayoutEffect(() => {
    camera.position.copy(arenaCameraPosition(aspect, scratch));
    camera.lookAt(ARENA_TARGET);
    if ("isPerspectiveCamera" in camera && camera.isPerspectiveCamera) {
      camera.fov = ARENA_FIELD_OF_VIEW;
      camera.updateProjectionMatrix();
    }
  }, [camera, aspect, scratch]);

  return null;
};
