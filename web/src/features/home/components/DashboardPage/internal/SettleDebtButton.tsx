import Button from "@mui/material/Button";
import { type FC, useState } from "react";
import { ConfirmDialog, MaterialIcon } from "@/components";
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
          py: 1,
          px: 1.75,
          fontSize: "0.75rem",
          minWidth: 0,
          borderWidth: "1.5px",
          "&:hover": { borderWidth: "1.5px" },
        })}
      >
        {homeCopy.settle}
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        onClose={closeConfirm}
        title={homeCopy.settleDialogTitle}
        body={homeCopy.settleDialogBody}
        confirmLabel={homeCopy.settleConfirm}
        pendingLabel={homeCopy.settlePending}
        cancelLabel={homeCopy.settleCancel}
        pending={pending}
        onConfirm={confirmSettle}
      />
    </>
  );
};
