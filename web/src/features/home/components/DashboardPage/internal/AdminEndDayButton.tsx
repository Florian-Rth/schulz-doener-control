import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { useState } from "react";
import { GhostButton, PrimaryButton } from "@/components";
import { homeCopy } from "../../../copy";
import { useDashboardContext } from "../../../dashboard-context";

// "Döner-Tag beenden" — scrap-and-end the running day (discards all orders, no debts).
// Visible to an admin OR the day's own Abholer (the backend authorizes both); self-gates on an
// open day, so the card can render it unconditionally. The collector still keeps their normal close
// controls — normal close creates debts, this force-end discards. Destructive, so it opens a confirm
// dialog before firing. Consumes the dashboard context; owns only the dialog state.
export const AdminEndDayButton: FC = () => {
  const { isAdmin, day, forceEndDay, isForceEndingDay } = useDashboardContext();
  const [open, setOpen] = useState(false);

  const dayId = day.id;
  if (!(isAdmin || day.amICollector) || dayId === null) {
    return null;
  }

  const closeDialog = (): void => {
    setOpen(false);
  };

  return (
    <Stack sx={{ mt: 1 }}>
      <GhostButton
        onClick={() => {
          setOpen(true);
        }}
      >
        {homeCopy.adminEndDay}
      </GhostButton>
      <Dialog open={open} onClose={closeDialog} fullWidth>
        <DialogTitle>{homeCopy.adminEndDialogTitle}</DialogTitle>
        <DialogContent sx={{ display: "flex" }}>
          <Stack sx={{ gap: 2, width: "100%", pt: 1 }}>
            <Typography sx={{ fontSize: "0.9375rem", color: "label.main", lineHeight: 1.5 }}>
              {homeCopy.adminEndDialogBody}
            </Typography>
            <PrimaryButton
              onClick={() => {
                forceEndDay(dayId);
              }}
              loading={isForceEndingDay}
              startIcon="lock"
            >
              {isForceEndingDay ? homeCopy.adminEndPending : homeCopy.adminEndConfirm}
            </PrimaryButton>
            <GhostButton onClick={closeDialog} disabled={isForceEndingDay}>
              {homeCopy.adminEndCancel}
            </GhostButton>
          </Stack>
        </DialogContent>
      </Dialog>
    </Stack>
  );
};
