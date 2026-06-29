import { type FC, useState } from "react";
import { ConfirmDialog, GhostButton } from "@/components";
import { homeCopy, takeOverDialogBody } from "../../../copy";
import { useDashboardContext } from "../../../dashboard-context";

interface TakeOverCollectorButtonProps {
  dayId: string;
  /** Current Abholer's display name — named in the confirmation body. */
  currentCollectorName: string;
}

// Low-emphasis "Ich übernehme die Abholung" control. Opens a confirmation dialog
// spelling out that taking over makes the caller the one who collects the money
// and closes the day. On confirm it claims the collector role; the backend
// rejects (400) callers without an order, which surfaces as a toast from the
// claimCollector mutation. Positive action → neutral tone (red-primary confirm).
export const TakeOverCollectorButton: FC<TakeOverCollectorButtonProps> = ({
  dayId,
  currentCollectorName,
}) => {
  const { claimCollector, isClaimingCollector } = useDashboardContext();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const closeConfirm = (): void => {
    setConfirmOpen(false);
  };

  const confirmTakeOver = (): void => {
    claimCollector(dayId);
    setConfirmOpen(false);
  };

  return (
    <>
      <GhostButton
        onClick={() => {
          setConfirmOpen(true);
        }}
      >
        {homeCopy.takeOverCollector}
      </GhostButton>

      <ConfirmDialog
        open={confirmOpen}
        onClose={closeConfirm}
        title={homeCopy.takeOverDialogTitle}
        body={takeOverDialogBody(currentCollectorName)}
        confirmLabel={homeCopy.takeOverConfirm}
        cancelLabel={homeCopy.takeOverCancel}
        pending={isClaimingCollector}
        onConfirm={confirmTakeOver}
      />
    </>
  );
};
