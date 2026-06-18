import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { MaterialIcon, PrimaryButton } from "@/components";
import { homeCopy } from "../../../copy";
import { useDashboardContext } from "../../../dashboard-context";

// CLOSED-state Döner-Tag card: dashed-red empty state + "Ich will heute Döner!"
// open-day CTA.
export const DayClosedCard: FC = () => {
  const { openDay, isOpeningDay } = useDashboardContext();

  return (
    <Paper
      sx={(theme) => ({
        p: 3,
        textAlign: "center",
        borderRadius: `${theme.radii.xl}px`,
        boxShadow: "0 2px 6px rgba(0,0,0,.10)",
        border: `1.5px dashed ${theme.palette.primary.main}`,
      })}
    >
      <Stack sx={{ alignItems: "center", gap: 0.5 }}>
        <Typography
          sx={{
            fontSize: "0.6875rem",
            fontWeight: 700,
            letterSpacing: ".1em",
            color: "primary.main",
            textTransform: "uppercase",
            mb: 0.5,
          }}
        >
          {homeCopy.dayClosedEyebrow}
        </Typography>
        <MaterialIcon name="no_meals" sx={{ fontSize: 46, color: "muted.main", opacity: 0.6 }} />
        <Typography sx={{ fontSize: "1.0625rem", fontWeight: 700, color: "navy.main", mt: 0.5 }}>
          {homeCopy.dayClosedTitle}
        </Typography>
        <Typography sx={{ fontSize: "0.8125rem", color: "muted.main", lineHeight: 1.45, mb: 1.5 }}>
          {homeCopy.dayClosedBody}
        </Typography>
        <PrimaryButton onClick={openDay} loading={isOpeningDay} startIcon="campaign">
          {homeCopy.openDay}
        </PrimaryButton>
      </Stack>
    </Paper>
  );
};
