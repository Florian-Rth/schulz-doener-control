import { type FC, useState } from "react";
import { buildFromAnswers, DoenerStage, useBuildReplay } from "@/components";
import type { PrintLine } from "@/features/home";
import { useThekenContext } from "../theken-context";

interface ThekenDoenerStageProps {
  line: PrintLine;
}

// The ordered Döner assembles itself in 3D, then goes on the turntable. The
// stage stays mounted across consecutive Döner screens (one WebGL scene), and
// each new order starts again from an empty bread — even an identical one.
export const ThekenDoenerStage: FC<ThekenDoenerStageProps> = ({ line }) => {
  const { seed } = useThekenContext();
  const replay = useBuildReplay(
    buildFromAnswers({ meat: line.meatKey, sauces: line.sauceKeys, text: line.extraText }),
  );

  const [shownNumber, setShownNumber] = useState(line.number);
  if (shownNumber !== line.number) {
    setShownNumber(line.number);
    replay.replay();
  }

  return <DoenerStage build={replay.build} presenting={replay.done} seed={seed + line.number} />;
};
