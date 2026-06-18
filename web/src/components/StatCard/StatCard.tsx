import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import type { SxProps, Theme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { IconChipBox } from "@/components/IconChipBox";
import { MaterialIcon } from "@/components/MaterialIcon";

type StatTint = "pink" | "green" | "orange";

interface StatCardProps {
  icon: string;
  label: string;
  value: string;
  /** Optional unit suffix, e.g. ` €` or ` Wo.`. */
  unit?: string;
  tint?: StatTint;
  /** Highlight the value (e.g. the "Offen" stat is orange). */
  valueColor?: "navy" | "orange";
  sx?: SxProps<Theme>;
}

const iconColorFor = (tint: StatTint): "primary" | "success" | "warning" => {
  switch (tint) {
    case "pink":
      return "primary";
    case "green":
      return "success";
    case "orange":
      return "warning";
  }
};

// One dashboard stat: tinted icon tile + uppercase label + big value (+ unit).
export const StatCard: FC<StatCardProps> = ({
  icon,
  label,
  value,
  unit,
  tint = "pink",
  valueColor = "navy",
  sx,
}) => {
  return (
    <Paper
      sx={[
        (theme) => ({
          p: 1.5,
          borderRadius: `${theme.radii.lg}px`,
          boxShadow: "0 1px 3px rgba(0,0,0,.10)",
        }),
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Stack direction="row" sx={{ alignItems: "center", gap: 1.25 }}>
        <IconChipBox tint={tint} size={4.75}>
          <MaterialIcon name={icon} color={iconColorFor(tint)} sx={{ fontSize: 21 }} />
        </IconChipBox>
        <Stack sx={{ minWidth: 0 }}>
          <Typography variant="eyebrow" sx={{ letterSpacing: ".03em", fontSize: "0.625rem" }}>
            {label}
          </Typography>
          <Typography
            component="div"
            sx={(theme) => ({
              fontSize: "1.3125rem",
              fontWeight: 700,
              lineHeight: 1.1,
              color: valueColor === "orange" ? theme.palette.warning.main : theme.palette.navy.main,
            })}
          >
            {value}
            {unit !== undefined ? (
              <Typography
                component="span"
                sx={{ fontSize: "0.75rem", fontWeight: 600, color: "muted.main" }}
              >
                {unit}
              </Typography>
            ) : null}
          </Typography>
        </Stack>
      </Stack>
    </Paper>
  );
};
