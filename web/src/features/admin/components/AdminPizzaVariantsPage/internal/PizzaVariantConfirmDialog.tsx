import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { GhostButton, PrimaryButton } from "@/components";
import { pizzaVariantsCopy } from "../../../copy";

interface PizzaVariantConfirmDialogProps {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  pendingLabel: string;
  isPending: boolean;
  serverError: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

// Confirm dialog for the destructive delete action on a pizza variant. The destructive action is
// the primary CTA.
export const PizzaVariantConfirmDialog: FC<PizzaVariantConfirmDialogProps> = ({
  open,
  title,
  body,
  confirmLabel,
  pendingLabel,
  isPending,
  serverError,
  onConfirm,
  onClose,
}) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: "navy.main" }}>{title}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Stack sx={{ gap: 0.5, pt: 0.5 }}>
          <Typography sx={{ fontSize: "0.875rem", color: "label.main", lineHeight: 1.5 }}>
            {body}
          </Typography>

          {serverError !== null ? (
            <Typography
              role="alert"
              sx={{ fontSize: "0.8125rem", color: "primary.main", fontWeight: 600, mt: 1 }}
            >
              {serverError}
            </Typography>
          ) : null}

          <PrimaryButton onClick={onConfirm} loading={isPending} sx={{ mt: 1.5 }}>
            {isPending ? pendingLabel : confirmLabel}
          </PrimaryButton>
          <GhostButton onClick={onClose} disabled={isPending} sx={{ mt: 1 }}>
            {pizzaVariantsCopy.cancel}
          </GhostButton>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};
