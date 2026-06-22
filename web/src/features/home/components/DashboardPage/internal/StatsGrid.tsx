import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { StatCard } from "@/components";
import { homeCopy } from "../../../copy";
import { useDashboardContext } from "../../../dashboard-context";

// The "Döner-Überwachung" eyebrow + the 2×2 grid of the four dashboard stats.
export const StatsGrid: FC = () => {
  const { stats } = useDashboardContext();

  return (
    <Stack sx={{ gap: 1.25 }}>
      <Typography variant="eyebrow" sx={{ px: 0.25, letterSpacing: ".1em" }}>
        {homeCopy.statsEyebrow}
      </Typography>
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
        <StatCard
          icon="restaurant"
          tint="pink"
          label={homeCopy.statTotal}
          value={stats.totalDoenerLabel}
        />
        <StatCard
          icon="euro"
          tint="green"
          label={homeCopy.statMonth}
          value={stats.monthSpendLabel}
          unit={homeCopy.monthUnit}
        />
        <StatCard
          icon="payments"
          tint="orange"
          valueColor="orange"
          label={homeCopy.statOpen}
          value={String(stats.openPaymentsCount)}
        />
        <StatCard
          icon="local_fire_department"
          tint="pink"
          label={homeCopy.statStreak}
          value={String(stats.streakWeeks)}
          unit={homeCopy.streakUnit}
        />
      </Box>
    </Stack>
  );
};
