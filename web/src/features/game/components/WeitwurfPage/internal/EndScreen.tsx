import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { GhostButton, PrimaryButton } from "@/components";
import { gameCopy } from "../../../copy";
import { useWeitwurfContext } from "../../../weitwurf-context";
import { HudStat } from "./HudStat";
import { LeaderboardList } from "./LeaderboardList";

// After the whistle: the score, a roast, the team Bestenliste and "Nochmal".
export const EndScreen: FC = () => {
  const {
    tally,
    roastLine,
    isPersonalBest,
    isSaving,
    saveFailed,
    leaderboard,
    leaderboardPending,
    leaderboardError,
    start,
    goHome,
  } = useWeitwurfContext();

  return (
    <Stack
      sx={{
        position: "absolute",
        inset: 0,
        pt: 9,
        backgroundColor: "rgba(0,0,0,.35)",
        overflowY: "auto",
      }}
    >
      <Paper
        role="dialog"
        aria-labelledby="weitwurf-end-title"
        sx={(theme) => ({
          // Auto top margin sits the card at the bottom but keeps it scrollable when taller.
          m: 2,
          mt: "auto",
          flexShrink: 0,
          borderRadius: `${theme.radii.xl}px`,
          p: 2.25,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
        })}
      >
        <Typography
          id="weitwurf-end-title"
          component="h2"
          sx={{ fontSize: "1.25rem", fontWeight: 800, color: "navy.main" }}
        >
          {gameCopy.endTitle}
        </Typography>
        <Typography
          sx={{
            fontSize: "2.75rem",
            fontWeight: 900,
            lineHeight: 1,
            color: "primary.main",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {`${tally.score} ${gameCopy.pointsSuffix}`}
        </Typography>
        {isPersonalBest ? (
          <Typography sx={{ fontSize: "0.8125rem", fontWeight: 700, color: "success.main" }}>
            {gameCopy.personalBest}
          </Typography>
        ) : null}
        <Typography sx={{ fontSize: "0.875rem", color: "label.main", lineHeight: 1.45 }}>
          {roastLine}
        </Typography>
        <Stack
          direction="row"
          sx={(theme) => ({
            gap: 1,
            backgroundColor: "navy.main",
            borderRadius: `${theme.radii.sm}px`,
            p: 1,
          })}
        >
          <HudStat label={gameCopy.hitsLabel} value={String(tally.hits)} />
          <HudStat label={gameCopy.missesLabel} value={String(tally.misses)} />
          <HudStat label={gameCopy.bestComboLabel} value={String(tally.bestCombo)} highlight />
        </Stack>
        {isSaving ? (
          <Typography sx={{ fontSize: "0.75rem", color: "muted.main" }}>
            {gameCopy.saving}
          </Typography>
        ) : null}
        {saveFailed ? (
          <Typography role="alert" sx={{ fontSize: "0.75rem", color: "primary.main" }}>
            {gameCopy.saveFailed}
          </Typography>
        ) : null}
        {leaderboardPending ? (
          <Typography sx={{ fontSize: "0.75rem", color: "muted.main" }}>
            {gameCopy.leaderboardLoading}
          </Typography>
        ) : null}
        {leaderboardError ? (
          <Typography sx={{ fontSize: "0.75rem", color: "primary.main" }}>
            {gameCopy.leaderboardError}
          </Typography>
        ) : null}
        {leaderboard !== undefined ? (
          <>
            <LeaderboardList title={gameCopy.leaderboardToday} entries={leaderboard.today} />
            <LeaderboardList title={gameCopy.leaderboardAllTime} entries={leaderboard.allTime} />
          </>
        ) : null}
        <PrimaryButton onClick={start} startIcon="local_fire_department">
          {gameCopy.again}
        </PrimaryButton>
        <GhostButton onClick={goHome}>{gameCopy.home}</GhostButton>
      </Paper>
    </Stack>
  );
};
