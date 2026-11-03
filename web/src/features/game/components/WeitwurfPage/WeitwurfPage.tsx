import Stack from "@mui/material/Stack";
import { type FC, lazy } from "react";
import { DoenerStage, EMPTY_BUILD } from "@/components";
import { useWeitwurfRound } from "../../hooks/use-weitwurf-round";
import { WeitwurfContext } from "../../weitwurf-context";
import { EndScreen } from "./internal/EndScreen";
import { GameHud } from "./internal/GameHud";
import { StartCard } from "./internal/StartCard";

// The throw controller pulls in three.js + Rapier: only loaded with the stage.
const ThrowController = lazy(() =>
  import("./internal/scene/ThrowController").then((module) => ({
    default: module.ThrowController,
  })),
);

// The Döner-Weitwurf: a full-screen Döner stage where colleagues fling
// ingredients into an empty bread while the Abholer is on the way.
export const WeitwurfPage: FC = () => {
  const round = useWeitwurfRound();

  return (
    <WeitwurfContext.Provider value={round}>
      <Stack sx={{ height: "100dvh", backgroundColor: "navy.main", overflow: "hidden" }}>
        <DoenerStage
          build={EMPTY_BUILD}
          word={round.word}
          overlay={
            <>
              <GameHud />
              {round.phase === "ready" ? <StartCard /> : null}
              {round.phase === "over" ? <EndScreen /> : null}
            </>
          }
        >
          <ThrowController
            key={round.round}
            active={round.phase === "playing"}
            onLanded={round.onLanded}
          />
        </DoenerStage>
      </Stack>
    </WeitwurfContext.Provider>
  );
};
