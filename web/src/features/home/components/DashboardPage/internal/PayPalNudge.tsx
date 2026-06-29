import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Link } from "@tanstack/react-router";
import { type FC, useState } from "react";
import { MaterialIcon, SecondaryButton } from "@/components";
import { useAuth } from "@/features/auth";
import { homeCopy } from "../../../copy";

// Pink-tint reminder for a user who hasn't stored a PayPal link yet — without it
// colleagues can only pay them in cash. Dismissable for the session; hidden once
// the handle is set. Bespoke panel (not MUI Alert, which is off-brand blue) and
// no toast (the nudge is persistent until set or dismissed).
export const PayPalNudge: FC = () => {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (user === null || user.payPalHandleSet || dismissed) {
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
        <MaterialIcon name="account_balance_wallet" sx={{ fontSize: 22, color: "primary.main" }} />
        <Stack sx={{ flex: 1, minWidth: 0, gap: 0.25 }}>
          <Typography sx={{ fontSize: "0.875rem", fontWeight: 700, color: "navy.main" }}>
            {homeCopy.paypalNudgeTitle}
          </Typography>
          <Typography sx={{ fontSize: "0.75rem", color: "label.main", lineHeight: 1.45 }}>
            {homeCopy.paypalNudgeBody}
          </Typography>
        </Stack>
        <IconButton
          size="small"
          aria-label={homeCopy.paypalNudgeDismissLabel}
          onClick={() => {
            setDismissed(true);
          }}
        >
          <MaterialIcon name="close" sx={{ fontSize: 18, color: "muted.main" }} />
        </IconButton>
      </Stack>
      <SecondaryButton component={Link} to="/einstellungen" startIcon="account_balance_wallet">
        {homeCopy.paypalNudgeCta}
      </SecondaryButton>
    </Stack>
  );
};
