import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { MaterialIcon, MedalRow } from "@/components";
import { useFunnyLine } from "@/lib/use-funny-line";
import {
  homeCopy,
  leaderboardShowAll,
  pickupQuote,
  untilNextSentence,
  untilNextTemplates,
} from "../../../copy";
import { useDashboardContext } from "../../../dashboard-context";
import { useLeaderboardRows } from "../../../hooks/use-leaderboard-rows";
import { CardExpander } from "./CardExpander";

// White Döner-Bestenliste card: header + medalled rows + current-user highlight,
// each row carrying the person's Abholer-Quote, an expander to the full field,
// and the "Nur noch X bis Platz N" footer.
export const LeaderboardCard: FC = () => {
  const { leaderboard } = useDashboardContext();
  const untilNextTemplate = useFunnyLine(untilNextTemplates);
  const { rows, isExpanded, canExpand, total, toggle } = useLeaderboardRows(leaderboard.rows);
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
            tierEmoji={row.tierEmoji ?? undefined}
            isMe={row.isMe}
            subline={pickupQuote(row.pickupsPerTenOrders)}
          />
        ))}
      </Stack>

      {canExpand ? (
        <CardExpander
          label={isExpanded ? homeCopy.leaderboardShowLess : leaderboardShowAll(total)}
          direction={isExpanded ? "less" : "more"}
          onClick={toggle}
          sx={{ mt: 0.5 }}
        />
      ) : null}

      {showUntilNext ? (
        <Typography
          sx={{ textAlign: "center", fontSize: "0.6875rem", color: "muted.main", mt: 1.25 }}
        >
          {untilNextSentence(
            untilNextTemplate,
            leaderboard.doenerToNextRank ?? 0,
            leaderboard.nextRank ?? 0,
          )}
        </Typography>
      ) : null}
    </Paper>
  );
};
