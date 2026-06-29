import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { type FC, useState } from "react";
import { ConfirmDialog, GhostButton, PrimaryButton } from "@/components";
import { homeCopy } from "../../../copy";
import { useDashboardContext } from "../../../dashboard-context";
import type { DashboardDay } from "../../../types";
import { AdminEndDayButton } from "./AdminEndDayButton";

interface CollectorControlsProps {
  day: DashboardDay;
}

// The collector's "Du steuerst den Tag" subsection: the single red close action
// (close ordering while open → close & settle once locked), the print list, and
// the destructive abort. Hairline-separated from the rest of the card so the one
// red primary here is clearly the collector's steering control. Renders nothing
// for non-collectors.
export const CollectorControls: FC<CollectorControlsProps> = ({ day }) => {
  const { closeOrdering, isClosingOrdering, closeDay, isClosingDay, goPrint } =
    useDashboardContext();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const dayId = day.id;
  if (!day.amICollector || dayId === null) {
    return null;
  }

  const closeConfirm = (): void => {
    setConfirmOpen(false);
  };

  // The close action is state-driven: while ordering is open the collector locks
  // ordering (no debts yet); once locked, closing the day settles it (creates the
  // debts). Each sub-state carries its own label + confirm copy.
  const isOrderingClosed = day.isOrderingClosed;
  const closeLabel = isOrderingClosed ? homeCopy.closeDay : homeCopy.closeOrdering;
  const closeStartIcon = isOrderingClosed ? "payments" : "lock_clock";
  const closePending = isOrderingClosed ? isClosingDay : isClosingOrdering;
  const dialogTitle = isOrderingClosed
    ? homeCopy.closeDayDialogTitle
    : homeCopy.closeOrderingDialogTitle;
  const dialogBody = isOrderingClosed
    ? homeCopy.closeDayDialogBody
    : homeCopy.closeOrderingDialogBody;
  const dialogConfirm = isOrderingClosed ? homeCopy.closeDayConfirm : homeCopy.closeOrderingConfirm;
  const dialogPending = isOrderingClosed ? homeCopy.closeDayPending : homeCopy.closeOrderingPending;
  const dialogCancel = isOrderingClosed ? homeCopy.closeDayCancel : homeCopy.closeOrderingCancel;

  const confirmClose = (): void => {
    if (isOrderingClosed) {
      closeDay(dayId);
    } else {
      closeOrdering(dayId);
    }
    setConfirmOpen(false);
  };

  return (
    <Stack
      sx={(theme) => ({
        gap: 1,
        mt: 2,
        pt: 2,
        borderTop: `1px solid ${theme.ds.inputBorder}`,
      })}
    >
      <Typography variant="eyebrow" sx={{ letterSpacing: ".08em" }}>
        {homeCopy.collectorSectionEyebrow}
      </Typography>

      <PrimaryButton
        startIcon={closeStartIcon}
        loading={closePending}
        onClick={() => {
          setConfirmOpen(true);
        }}
      >
        {closeLabel}
      </PrimaryButton>

      {day.orders.length > 0 ? (
        <GhostButton startIcon="print" onClick={goPrint}>
          {homeCopy.printList}
        </GhostButton>
      ) : null}

      <AdminEndDayButton />

      <ConfirmDialog
        open={confirmOpen}
        onClose={closeConfirm}
        tone="destructive"
        title={dialogTitle}
        body={dialogBody}
        confirmLabel={dialogConfirm}
        pendingLabel={dialogPending}
        cancelLabel={dialogCancel}
        confirmIcon={closeStartIcon}
        pending={closePending}
        onConfirm={confirmClose}
      />
    </Stack>
  );
};
