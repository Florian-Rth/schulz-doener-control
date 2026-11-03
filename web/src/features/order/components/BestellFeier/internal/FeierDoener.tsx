import type { FC } from "react";
import { type DoenerBuild, DoenerStage, useBuildReplay } from "@/components";

interface FeierDoenerProps {
  build: DoenerBuild;
  seed: number;
}

// The colleague's own Döner, thrown together again in fast-forward while the
// turntable spins — everything is in well before the celebration ends.
export const FeierDoener: FC<FeierDoenerProps> = ({ build, seed }) => {
  const replay = useBuildReplay(build, { beatMs: 280, startDelayMs: 300 });

  return <DoenerStage build={replay.build} presenting seed={seed} />;
};
