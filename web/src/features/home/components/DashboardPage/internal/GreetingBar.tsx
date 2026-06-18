import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { Avatar } from "@/components";
import { homeCopy } from "../../../copy";
import { useDashboardContext } from "../../../dashboard-context";

// "Moin, {firstName} 🥙" + the day subline, with the caller's avatar on the
// right. Reads the greeting name + avatar color from the dashboard context.
export const GreetingBar: FC = () => {
  const { firstName, displayName, avatarColorHex } = useDashboardContext();

  return (
    <Stack direction="row" sx={{ alignItems: "center", gap: 1.5, px: 0.25, pt: 1 }}>
      <Stack sx={{ flex: 1, minWidth: 0 }}>
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
        <Typography sx={{ fontSize: "0.8125rem", color: "muted.main" }}>
          {homeCopy.greetingSubline}
        </Typography>
      </Stack>
      <Avatar displayName={displayName} colorHex={avatarColorHex} size={44} />
    </Stack>
  );
};
