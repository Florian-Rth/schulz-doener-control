import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { type FC, useState } from "react";
import { GhostButton, MaterialIcon, PrimaryButton } from "@/components";
import { homeCopy } from "../../../copy";
import { useDashboardContext } from "../../../dashboard-context";

interface SettleDebtButtonProps {
  debtId: string;
}

// The per-debt "Erledigt" control: a small pill that opens a confirmation dialog
// before firing the one-way settle. The dialog spells out that this is the
// caller's personal "ich hab bezahlt" and that it cannot be undone. While the
// settle is in flight both the pill and the confirm button disable; on success
// the row leaves the open list via dashboard invalidation.
export const SettleDebtButton: FC<SettleDebtButtonProps> = ({ debtId }) => {
  const { settle, isSettling } = useDashboardContext();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const pending = isSettling(debtId);

  const closeConfirm = (): void => {
    setConfirmOpen(false);
  };

  const confirmSettle = (): void => {
    settle(debtId);
  };

  return (
    <>
      <Button
        color="success"
        variant="outlined"
        disabled={pending}
        onClick={() => {
          setConfirmOpen(true);
        }}
        startIcon={<MaterialIcon name="check" sx={{ fontSize: 16 }} />}
        sx={(theme) => ({
          borderRadius: `${theme.radii.sm - 3}px`,
          fontWeight: 700,
          py: 0.625,
          px: 1.5,
          fontSize: "0.75rem",
          minWidth: 0,
          borderWidth: "1.5px",
          "&:hover": { borderWidth: "1.5px" },
        })}
      >
        {homeCopy.settle}
      </Button>

      <Dialog open={confirmOpen} onClose={closeConfirm} fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: "navy.main" }}>
          {homeCopy.settleDialogTitle}
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Stack sx={{ gap: 0.5, pt: 0.5 }}>
            <Typography sx={{ fontSize: "0.875rem", color: "label.main", lineHeight: 1.5 }}>
              {homeCopy.settleDialogBody}
            </Typography>

            <PrimaryButton onClick={confirmSettle} loading={pending} sx={{ mt: 1.5 }}>
              {pending ? homeCopy.settlePending : homeCopy.settleConfirm}
            </PrimaryButton>
            <GhostButton onClick={closeConfirm} disabled={pending} sx={{ mt: 1 }}>
              {homeCopy.settleCancel}
            </GhostButton>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
};
