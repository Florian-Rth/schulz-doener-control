import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import type { SxProps, Theme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import type { FC } from "react";

interface TierRowProps {
  emoji: string;
  name: string;
  tagline: string;
  /** Highlights the row (pink tint + red border) and shows the "DEIN TIER" badge. */
  isMine?: boolean;
  sx?: SxProps<Theme>;
}

// One catalog row: emoji tile + name (+ "DEIN TIER" badge when mine) + tagline.
export const TierRow: FC<TierRowProps> = ({ emoji, name, tagline, isMine = false, sx }) => {
  return (
    <Paper
      sx={[
        (theme) => ({
          p: 1.5,
          borderRadius: `${theme.radii.lg}px`,
          border: "1.5px solid",
          borderColor: isMine ? theme.palette.primary.main : "transparent",
          backgroundColor: isMine ? theme.palette.pinkTint.main : theme.palette.background.paper,
          boxShadow: "0 1px 3px rgba(0,0,0,.08)",
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Stack direction="row" sx={{ gap: 1.5, alignItems: "flex-start" }}>
        <Stack
          sx={(theme) => ({
            width: theme.spacing(5.5),
            height: theme.spacing(5.5),
            borderRadius: `${theme.radii.md}px`,
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontSize: "1.5rem",
            backgroundColor: theme.palette.subtle.main,
          })}
        >
          <span aria-hidden>{emoji}</span>
        </Stack>
        <Stack sx={{ minWidth: 0, gap: 0.375 }}>
          <Stack direction="row" sx={{ gap: 1, alignItems: "center", flexWrap: "wrap" }}>
            <Typography sx={{ fontSize: "0.9375rem", fontWeight: 700, color: "navy.main" }}>
              {name}
            </Typography>
            {isMine ? (
              <Typography
                component="span"
                sx={(theme) => ({
                  fontSize: "0.5625rem",
                  fontWeight: 800,
                  letterSpacing: ".06em",
                  color: theme.palette.primary.contrastText,
                  backgroundColor: theme.palette.primary.main,
                  borderRadius: `${theme.radii.pill}px`,
                  px: 0.875,
                  py: 0.25,
                })}
              >
                DEIN TIER
              </Typography>
            ) : null}
          </Stack>
          <Typography sx={{ fontSize: "0.75rem", color: "muted.main", lineHeight: 1.45 }}>
            {tagline}
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  );
};
