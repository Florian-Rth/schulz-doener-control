import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { MaterialIcon } from "@/components";
import { gameCopy, timeLeftLabel } from "../../../copy";
import { comboMultiplier } from "../../../scoring";
import { useWeitwurfContext } from "../../../weitwurf-context";
import { HudStat } from "./HudStat";

// Top bar over the stage: back, score, time and Sauerei. Clicks pass through
// everywhere except the back button, so swipes reach the canvas.
export const GameHud: FC = () => {
  const { tally, secondsLeft, phase, goHome } = useWeitwurfContext();
  const showCombo = phase === "playing" && tally.combo >= 2;

  return (
    <Stack
      sx={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        gap: 1,
        px: 2,
        pt: 2,
        pointerEvents: "none",
      }}
    >
      <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
        <ButtonBase
          aria-label={gameCopy.back}
          onClick={goHome}
          sx={(theme) => ({
            width: 40,
            height: 40,
            borderRadius: `${theme.radii.sm - 1}px`,
            backgroundColor: "rgba(255,255,255,.12)",
            pointerEvents: "auto",
          })}
        >
          <MaterialIcon name="arrow_back" sx={{ fontSize: 22, color: "navy.contrastText" }} />
        </ButtonBase>
        <HudStat label={gameCopy.scoreLabel} value={String(tally.score)} highlight />
        <HudStat
          label={gameCopy.timeLabel}
          value={timeLeftLabel(secondsLeft)}
          warning={phase === "playing" && secondsLeft <= 5}
        />
        <HudStat label={gameCopy.missesLabel} value={String(tally.misses)} />
      </Stack>
      {showCombo ? (
        <Typography
          aria-live="polite"
          sx={(theme) => ({
            alignSelf: "center",
            fontSize: "0.8125rem",
            fontWeight: 800,
            color: "navy.main",
            backgroundColor: "gold.main",
            borderRadius: `${theme.radii.pill}px`,
            px: 1.5,
            py: 0.5,
          })}
        >
          {gameCopy.comboBadge(comboMultiplier(tally.combo))}
        </Typography>
      ) : null}
      {phase === "overtime" ? (
        <Typography
          aria-live="polite"
          sx={{ alignSelf: "center", fontSize: "0.8125rem", color: "navy.contrastText" }}
        >
          {gameCopy.overtime}
        </Typography>
      ) : null}
    </Stack>
  );
};
