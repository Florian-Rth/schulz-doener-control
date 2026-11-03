import { type FC, lazy, Suspense } from "react";
import type { DoenerMascotProps } from "./mascot";

// The 3D part (three.js + Rapier) is only downloaded with the stage itself.
const MascotStandee = lazy(() =>
  import("./internal/scene/MascotStandee").then((module) => ({ default: module.MascotStandee })),
);

/**
 * A Döner-Tier as a cardboard standee on the stage — pass it as `<DoenerStage>`
 * children (it only works inside the stage's scene):
 *
 *   <DoenerStage build={build}>
 *     <DoenerMascot emoji="🐺" name="Der Knoblauch-Wolf" />
 *   </DoenerStage>
 *
 * Several can stand side by side via `position`. It loads on its own, without
 * holding back the rest of the scene.
 */
export const DoenerMascot: FC<DoenerMascotProps> = (props) => {
  const { emoji, name, side, position } = props;
  return (
    <Suspense fallback={null}>
      {/* The cardboard is painted once: a new Tier or spot is a new standee. */}
      <MascotStandee
        key={`${emoji}|${name}|${side ?? ""}|${position?.join(",") ?? ""}`}
        {...props}
      />
    </Suspense>
  );
};
