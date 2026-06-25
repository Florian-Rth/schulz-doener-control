import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { useState } from "react";
import { GhostButton, PrimaryButton } from "@/components";
import { orderCopy } from "../../../copy";
import { useOrderFormContext } from "../../../order-context";

// Withdraw-my-order action for the order screen: a destructive ghost trigger + a local confirm
// dialog. Only renders when an order already exists (canRemove). Consumes the order context; holds
// just the dialog open/close UI state. Pure UI.
export const RemoveOrderButton: FC = () => {
  const { canRemove, removeOrder, isRemoving, removeError } = useOrderFormContext();
  const [open, setOpen] = useState(false);

  if (!canRemove) {
    return null;
  }

  const closeDialog = (): void => {
    setOpen(false);
  };

  return (
    <>
      <GhostButton
        onClick={() => {
          setOpen(true);
        }}
      >
        {orderCopy.removeOrder}
      </GhostButton>
      <Dialog open={open} onClose={closeDialog} fullWidth>
        <DialogTitle>{orderCopy.removeConfirmTitle}</DialogTitle>
        <DialogContent sx={{ display: "flex" }}>
          <Stack sx={{ gap: 2, width: "100%", pt: 1 }}>
            <Typography sx={{ fontSize: "0.9375rem", color: "label.main", lineHeight: 1.5 }}>
              {orderCopy.removeConfirmBody}
            </Typography>
            {removeError !== null ? (
              <Typography sx={{ fontSize: "0.8125rem", fontWeight: 600, color: "primary.main" }}>
                {removeError}
              </Typography>
            ) : null}
            <PrimaryButton onClick={removeOrder} loading={isRemoving} startIcon="no_meals">
              {isRemoving ? orderCopy.removePending : orderCopy.removeConfirmCta}
            </PrimaryButton>
            <GhostButton onClick={closeDialog} disabled={isRemoving}>
              {orderCopy.removeCancel}
            </GhostButton>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
};
