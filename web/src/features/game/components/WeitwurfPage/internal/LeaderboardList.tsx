import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { Avatar } from "@/components";
import { gameCopy } from "../../../copy";
import type { GameScoreEntry } from "../../../types";

interface LeaderboardListProps {
  title: string;
  entries: readonly GameScoreEntry[];
}

// One ranked block of the Weitwurf-Bestenliste; the caller's row is tinted.
export const LeaderboardList: FC<LeaderboardListProps> = ({ title, entries }) => (
  <Stack sx={{ gap: 0.75 }}>
    <Typography variant="eyebrow">{title}</Typography>
    {entries.length === 0 ? (
      <Typography sx={{ fontSize: "0.8125rem", color: "muted.main" }}>
        {gameCopy.leaderboardEmpty}
      </Typography>
    ) : (
      <Stack component="ol" sx={{ gap: 0.5, m: 0, p: 0, listStyle: "none" }}>
        {entries.map((entry) => (
          <Stack
            key={entry.userId}
            component="li"
            direction="row"
            sx={(theme) => ({
              alignItems: "center",
              gap: 1.25,
              px: 1,
              py: 0.75,
              borderRadius: `${theme.radii.sm - 1}px`,
              backgroundColor: entry.isMe ? "pinkTint.main" : "transparent",
            })}
          >
            <Typography
              sx={{ width: 22, fontSize: "0.8125rem", fontWeight: 800, color: "muted.main" }}
            >
              {entry.rank}.
            </Typography>
            <Avatar displayName={entry.displayName} colorHex={entry.avatarColorHex} size={30} />
            <Typography
              sx={{
                flex: 1,
                minWidth: 0,
                fontSize: "0.875rem",
                fontWeight: entry.isMe ? 700 : 600,
                color: "navy.main",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {entry.displayName}
            </Typography>
            <Typography
              sx={{
                fontSize: "0.875rem",
                fontWeight: 800,
                color: "navy.main",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {`${entry.score} ${gameCopy.pointsSuffix}`}
            </Typography>
          </Stack>
        ))}
      </Stack>
    )}
  </Stack>
);
