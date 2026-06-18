import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { MaterialIcon, MedalRow } from "@/components";
import { homeCopy, untilNextSentence } from "../../../copy";
import { useDashboardContext } from "../../../dashboard-context";
import type { LeaderboardRow } from "../../../types";

// Builds the rows to show: the top 3 (medalled), plus the caller's own row when
// they sit outside the top 3 (mock parity — the highlighted "4." row).
const visibleRows = (rows: readonly LeaderboardRow[]): LeaderboardRow[] => {
  const top = rows.filter((row) => row.medal !== null);
  const me = rows.find((row) => row.isMe);
  if (me !== undefined && !top.some((row) => row.userId === me.userId)) {
    return [...top, me];
  }
  return top;
};

// White Döner-Bestenliste card: header + medalled rows + current-user highlight
// + the "Nur noch X bis Platz N" footer.
export const LeaderboardCard: FC = () => {
  const { leaderboard } = useDashboardContext();
  const rows = visibleRows(leaderboard.rows);
  const showUntilNext = leaderboard.doenerToNextRank !== null && leaderboard.nextRank !== null;

  return (
    <Paper
      sx={(theme) => ({
        p: 2,
        borderRadius: `${theme.radii.xl}px`,
        boxShadow: "0 2px 6px rgba(0,0,0,.10)",
      })}
    >
      <Stack direction="row" sx={{ alignItems: "center", gap: 1, mb: 1.5 }}>
        <MaterialIcon name="emoji_events" sx={{ fontSize: 20, color: "gold.main" }} />
        <Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "navy.main" }}>
          {homeCopy.leaderboardTitle}
        </Typography>
        <Stack sx={{ flex: 1 }} />
        <Typography sx={{ fontSize: "0.6875rem", fontWeight: 600, color: "muted.main" }}>
          {leaderboard.year}
        </Typography>
      </Stack>

      <Stack sx={{ gap: 0.25 }}>
        {rows.map((row) => (
          <MedalRow
            key={row.userId}
            rank={row.rank}
            displayName={row.displayName}
            avatarColorHex={row.avatarColorHex}
            count={row.count}
            medal={row.medal ?? undefined}
            isMe={row.isMe}
          />
        ))}
      </Stack>

      {showUntilNext ? (
        <Typography
          sx={{ textAlign: "center", fontSize: "0.6875rem", color: "muted.main", mt: 1.25 }}
        >
          {untilNextSentence(leaderboard.doenerToNextRank ?? 0, leaderboard.nextRank ?? 0)}
        </Typography>
      ) : null}
    </Paper>
  );
};
