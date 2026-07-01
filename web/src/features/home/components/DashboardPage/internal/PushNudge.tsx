import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Link } from "@tanstack/react-router";
import type { FC } from "react";
import { MaterialIcon, SecondaryButton } from "@/components";
import { homeCopy } from "../../../copy";
import { usePushNudge } from "../../../hooks/use-push-nudge";

// Pink-tint reminder for a user who has notifications off — so they hear when a colleague opens the
// Döner-Tag. Mirrors PayPalNudge's look; links to the notifications page. Dismissal is persisted in
// localStorage (once and done), and the hint never shows when notifications are already on, were
// explicitly denied, or aren't switch-on-able on this device.
export const PushNudge: FC = () => {
  const { visible, dismiss } = usePushNudge();

  if (!visible) {
    return null;
  }

  return (
    <Stack
      sx={(theme) => ({
        gap: 1.25,
        backgroundColor: "pinkTint.main",
        borderRadius: `${theme.radii.lg}px`,
        p: 1.75,
      })}
    >
      <Stack direction="row" sx={{ alignItems: "flex-start", gap: 1.25 }}>
        <MaterialIcon name="notifications_active" sx={{ fontSize: 22, color: "primary.main" }} />
        <Stack sx={{ flex: 1, minWidth: 0, gap: 0.25 }}>
          <Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "navy.main" }}>
            {homeCopy.pushNudgeTitle}
          </Typography>
          <Typography sx={{ fontSize: "0.75rem", color: "label.main", lineHeight: 1.45 }}>
            {homeCopy.pushNudgeBody}
          </Typography>
        </Stack>
        <IconButton size="small" aria-label={homeCopy.pushNudgeDismissLabel} onClick={dismiss}>
          <MaterialIcon name="close" sx={{ fontSize: 18, color: "muted.main" }} />
        </IconButton>
      </Stack>
      <SecondaryButton component={Link} to="/benachrichtigungen" startIcon="notifications_active">
        {homeCopy.pushNudgeCta}
      </SecondaryButton>
    </Stack>
  );
};
