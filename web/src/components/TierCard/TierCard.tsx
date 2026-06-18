import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import type { SxProps, Theme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import type { FC, ReactNode } from "react";
import { Schraege } from "@/components/RedChromeSurface/internal/Schraege";

interface TierCardProps {
  emoji: string;
  name: string;
  tagline: string;
  tags: readonly string[];
  /** e.g. "Aus 142 Bestellungen der letzten 3 Monate". */
  orderCountLabel: string;
  eyebrow?: string;
  /** "Alle Tiere ansehen" link, rendered at the foot. */
  footer?: ReactNode;
  sx?: SxProps<Theme>;
}

// Navy tier card with the deep Schräge: emoji tile + eyebrow + name + tagline +
// order-count line + tag chips + optional footer link slot.
export const TierCard: FC<TierCardProps> = ({
  emoji,
  name,
  tagline,
  tags,
  orderCountLabel,
  eyebrow = "Dein Döner-Tier",
  footer,
  sx,
}) => {
  return (
    <Paper
      sx={[
        (theme) => ({
          position: "relative",
          overflow: "hidden",
          p: 2,
          borderRadius: `${theme.radii.xl}px`,
          backgroundColor: theme.palette.navy.main,
          color: theme.palette.navy.contrastText,
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Schraege variant="deep" light />
      <Stack
        direction="row"
        sx={{ position: "relative", zIndex: 1, gap: 1.5, alignItems: "flex-start" }}
      >
        <Stack
          sx={(theme) => ({
            width: theme.spacing(7),
            height: theme.spacing(7),
            borderRadius: `${theme.radii.lg}px`,
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontSize: "2rem",
            backgroundColor: theme.schraege.overlayLight,
          })}
        >
          <span aria-hidden>{emoji}</span>
        </Stack>
        <Stack sx={{ minWidth: 0, gap: 0.5 }}>
          <Typography variant="eyebrow" sx={{ color: "muted.main" }}>
            {eyebrow}
          </Typography>
          <Typography sx={{ fontSize: "1.25rem", fontWeight: 700, lineHeight: 1.1 }}>
            {name}
          </Typography>
          <Typography sx={{ fontSize: "0.8125rem", color: "muted.main", lineHeight: 1.4 }}>
            {tagline}
          </Typography>
          <Typography sx={{ fontSize: "0.75rem", color: "muted.main", mt: 0.5 }}>
            {orderCountLabel}
          </Typography>
        </Stack>
      </Stack>
      <Stack
        direction="row"
        sx={{ position: "relative", zIndex: 1, gap: 0.75, flexWrap: "wrap", mt: 1.5 }}
      >
        {tags.map((tag) => (
          <Chip
            key={tag}
            label={tag}
            size="small"
            sx={(theme) => ({
              backgroundColor: theme.schraege.overlayLight,
              color: theme.palette.navy.contrastText,
              fontWeight: 600,
              fontSize: "0.6875rem",
            })}
          />
        ))}
      </Stack>
      {footer !== undefined ? (
        <Stack sx={{ position: "relative", zIndex: 1, mt: 1.5 }}>{footer}</Stack>
      ) : null}
    </Paper>
  );
};
