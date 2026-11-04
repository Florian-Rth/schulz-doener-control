import Stack from "@mui/material/Stack";
import { type FC, lazy } from "react";
import { DoenerStage, EMPTY_BUILD } from "@/components";
import { useWeitwurfRound } from "../../hooks/use-weitwurf-round";
import { WeitwurfContext } from "../../weitwurf-context";
import { EndScreen } from "./internal/EndScreen";
import { GameHud } from "./internal/GameHud";
import { NextPieceLabel } from "./internal/NextPieceLabel";
import { StartCard } from "./internal/StartCard";

// The throw controller pulls in three.js + Rapier: only loaded with the stage.
const ThrowController = lazy(() =>
  import("./internal/scene/ThrowController").then((module) => ({
    default: module.ThrowController,
  })),
);

// The Döner-Weitwurf: a full-screen arena where colleagues fling ingredients
// into buckets — near and easy, or far and worth a lot — while the Abholer is
// on the way.
export const WeitwurfPage: FC = () => {
  const round = useWeitwurfRound();

  return (
    <WeitwurfContext.Provider value={round}>
      <Stack sx={{ height: "100dvh", backgroundColor: "navy.main", overflow: "hidden" }}>
        <DoenerStage
          build={EMPTY_BUILD}
          scenery="arena"
          overlay={
            <>
              <GameHud />
              {round.phase === "playing" ? <NextPieceLabel /> : null}
              {round.phase === "ready" ? <StartCard /> : null}
              {round.phase === "over" ? <EndScreen /> : null}
            </>
          }
        >
          <ThrowController
            key={round.round}
            active={round.phase === "playing"}
            nextKind={round.nextKind}
            onThrow={round.onThrow}
            onLanded={round.onLanded}
          />
        </DoenerStage>
      </Stack>
    </WeitwurfContext.Provider>
  );
};
