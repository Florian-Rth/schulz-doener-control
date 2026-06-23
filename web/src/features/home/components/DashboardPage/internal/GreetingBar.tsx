import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { greetingSublineForWeekday } from "../../../copy";
import { useDashboardContext } from "../../../dashboard-context";

// "Moin, {firstName} 🥙" + a Döner pun for today's weekday. Reads the greeting name from the
// dashboard context; the subline is derived from the current day (Dönerstag & friends). The profile
// avatar lives in the app bar, not here.
export const GreetingBar: FC = () => {
  const { firstName } = useDashboardContext();
  const subline = greetingSublineForWeekday(new Date().getDay());

  return (
    <Stack sx={{ px: 0.25, pt: 1 }}>
      <Typography
        sx={{
          fontSize: "1.3125rem",
          fontWeight: 700,
          color: "navy.main",
          letterSpacing: "-.01em",
        }}
      >
        Moin, {firstName} 🥙
      </Typography>
      <Typography sx={{ fontSize: "0.8125rem", color: "muted.main" }}>{subline}</Typography>
    </Stack>
  );
};
