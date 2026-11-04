import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";

interface HudStatProps {
  label: string;
  value: string;
  /** The score: gold number. */
  highlight?: boolean;
  /** Last seconds: red number. */
  warning?: boolean;
}

// One translucent stat chip of the HUD.
export const HudStat: FC<HudStatProps> = ({ label, value, highlight = false, warning = false }) => (
  <Stack
    role="group"
    aria-label={label}
    sx={(theme) => ({
      flex: 1,
      minWidth: 0,
      alignItems: "center",
      borderRadius: `${theme.radii.sm - 1}px`,
      backgroundColor: "rgba(255,255,255,.12)",
      py: 0.5,
    })}
  >
    <Typography sx={{ fontSize: "0.625rem", color: "rgba(255,255,255,.7)", fontWeight: 600 }}>
      {label}
    </Typography>
    <Typography
      sx={{
        fontSize: "1.0625rem",
        fontWeight: 800,
        lineHeight: 1.2,
        fontVariantNumeric: "tabular-nums",
        color: warning ? "primary.main" : highlight ? "gold.main" : "navy.contrastText",
      }}
    >
      {value}
    </Typography>
  </Stack>
);
