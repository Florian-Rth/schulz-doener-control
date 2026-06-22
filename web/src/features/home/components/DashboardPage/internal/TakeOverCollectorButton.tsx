import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { type FC, useState } from "react";
import { GhostButton, PrimaryButton } from "@/components";
import { homeCopy, takeOverDialogBody } from "../../../copy";
import { useDashboardContext } from "../../../dashboard-context";

interface TakeOverCollectorButtonProps {
  dayId: string;
  /** Current Abholer's display name — named in the confirmation body. */
  currentCollectorName: string;
}

// Low-emphasis "Ich übernehme die Abholung" control. Opens a confirmation dialog
// (mirrors SettleDebtButton's structure) spelling out that taking over makes the
// caller the one who collects the money and closes the day. On confirm it claims
// the collector role; the backend rejects (400) callers without an order, which
// surfaces as a toast from the claimCollector mutation.
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

      <Dialog open={confirmOpen} onClose={closeConfirm} fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: "navy.main" }}>
          {homeCopy.takeOverDialogTitle}
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Stack sx={{ gap: 0.5, pt: 0.5 }}>
            <Typography sx={{ fontSize: "0.875rem", color: "label.main", lineHeight: 1.5 }}>
              {takeOverDialogBody(currentCollectorName)}
            </Typography>

            <PrimaryButton onClick={confirmTakeOver} loading={isClaimingCollector} sx={{ mt: 1.5 }}>
              {homeCopy.takeOverConfirm}
            </PrimaryButton>
            <GhostButton onClick={closeConfirm} disabled={isClaimingCollector} sx={{ mt: 1 }}>
              {homeCopy.takeOverCancel}
            </GhostButton>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
};
