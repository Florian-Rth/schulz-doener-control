import Stack from "@mui/material/Stack";
import type { FC } from "react";
import { useState } from "react";
import { ConfirmDialog, GhostButton } from "@/components";
import { homeCopy } from "../../../copy";
import { useDashboardContext } from "../../../dashboard-context";

// "Döner-Tag abbrechen" — scrap-and-abort the running day (discards all orders, no debts).
// Visible to an admin OR the day's own Abholer (the backend authorizes both); self-gates on an
// open day, so the card can render it unconditionally. The collector still keeps their normal close
// controls — normal close creates debts, this abort discards. Destructive, so it opens a confirm
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
        startIcon="cancel"
        onClick={() => {
          setOpen(true);
        }}
      >
        {homeCopy.adminEndDay}
      </GhostButton>
      <ConfirmDialog
        open={open}
        onClose={closeDialog}
        tone="destructive"
        title={homeCopy.adminEndDialogTitle}
        body={homeCopy.adminEndDialogBody}
        confirmLabel={homeCopy.adminEndConfirm}
        pendingLabel={homeCopy.adminEndPending}
        cancelLabel={homeCopy.adminEndCancel}
        confirmIcon="cancel"
        pending={isForceEndingDay}
        onConfirm={() => {
          forceEndDay(dayId);
        }}
      />
    </Stack>
  );
};
