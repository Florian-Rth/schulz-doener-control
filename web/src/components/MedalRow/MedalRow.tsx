import Stack from "@mui/material/Stack";
import type { SxProps, Theme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { Avatar } from "@/components/Avatar";

interface MedalRowProps {
  rank: number;
  displayName: string;
  avatarColorHex: string;
  count: number;
  /** Top-3 medal emoji; falls back to "{rank}." when absent. */
  medal?: string;
  /** Highlights the current user's row (red text + pink tint + "· du"). */
  isMe?: boolean;
  sx?: SxProps<Theme>;
}

// One leaderboard row: rank/medal + avatar + name + count. The current user's
// row is red-highlighted and suffixed with "· du".
export const MedalRow: FC<MedalRowProps> = ({
  rank,
  displayName,
  avatarColorHex,
  count,
  medal,
  isMe = false,
  sx,
}) => {
  return (
    <Stack
      direction="row"
      sx={[
        (theme) => ({
          alignItems: "center",
          gap: 1.375,
          px: 1.25,
          py: 1.125,
          borderRadius: `${theme.radii.md}px`,
          backgroundColor: isMe ? theme.palette.pinkTint.main : "transparent",
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Typography
        component="span"
        sx={(theme) => ({
          width: 24,
          textAlign: "center",
          fontSize: medal !== undefined ? "1rem" : "0.8125rem",
          fontWeight: 700,
          color: isMe ? theme.palette.primary.main : theme.palette.muted.main,
        })}
      >
        {medal ?? `${rank}.`}
      </Typography>
      <Avatar displayName={displayName} colorHex={avatarColorHex} size={34} />
      <Typography
        sx={(theme) => ({
          flex: 1,
          minWidth: 0,
          fontSize: "0.875rem",
          fontWeight: isMe ? 700 : 600,
          color: isMe ? theme.palette.primary.main : theme.palette.navy.main,
        })}
      >
        {displayName}
        {isMe ? (
          <Typography
            component="span"
            sx={(theme) => ({
              fontSize: "0.6875rem",
              fontWeight: 600,
              color: theme.palette.primary.main,
              opacity: 0.7,
              ml: 0.5,
            })}
          >
            · du
          </Typography>
        ) : null}
      </Typography>
      <Typography
        sx={(theme) => ({
          fontSize: "0.875rem",
          fontWeight: 700,
          color: isMe ? theme.palette.primary.main : theme.palette.navy.main,
        })}
      >
        {count}
      </Typography>
    </Stack>
  );
};
