import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";
import type { FC, ReactNode } from "react";
import { GhostButton } from "@/components/buttons/GhostButton";
import { PrimaryButton } from "@/components/buttons/PrimaryButton";
import { SecondaryButton } from "@/components/buttons/SecondaryButton";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  /** Shown on the confirm button while `pending`; falls back to `confirmLabel`. */
  pendingLabel?: string;
  cancelLabel: string;
  onConfirm: () => void;
  pending?: boolean;
  /**
   * "neutral" (default): a positive action — the red primary confirm sits on top.
   * "destructive": the SAFE choice is prominent — the navy cancel sits on top and
   * the destructive confirm is the de-emphasised ghost button below.
   */
  tone?: "neutral" | "destructive";
  /** Optional leading Material icon on the confirm button. */
  confirmIcon?: string;
}

// Shared confirm dialog: a title, body, and a two-button stack whose emphasis
// flips by tone. Both buttons disable while `pending`; the confirm shows
// `pendingLabel`. The button order is intentional — for destructive actions the
// safe escape (cancel) is the visually dominant default.
export const ConfirmDialog: FC<ConfirmDialogProps> = ({
  open,
  onClose,
  title,
  body,
  confirmLabel,
  pendingLabel,
  cancelLabel,
  onConfirm,
  pending = false,
  tone = "neutral",
  confirmIcon,
}) => {
  const confirmText = pending && pendingLabel !== undefined ? pendingLabel : confirmLabel;

  const confirmButton =
    tone === "destructive" ? (
      <GhostButton onClick={onConfirm} disabled={pending} startIcon={confirmIcon}>
        {confirmText}
      </GhostButton>
    ) : (
      <PrimaryButton onClick={onConfirm} loading={pending} startIcon={confirmIcon}>
        {confirmText}
      </PrimaryButton>
    );

  const cancelButton =
    tone === "destructive" ? (
      <SecondaryButton onClick={onClose} disabled={pending}>
        {cancelLabel}
      </SecondaryButton>
    ) : (
      <GhostButton onClick={onClose} disabled={pending}>
        {cancelLabel}
      </GhostButton>
    );

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: "navy.main" }}>{title}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1, pt: 1 }}>
        <Typography sx={{ fontSize: "0.9375rem", color: "label.main", lineHeight: 1.5, mb: 0.5 }}>
          {body}
        </Typography>
        {tone === "destructive" ? cancelButton : confirmButton}
        {tone === "destructive" ? confirmButton : cancelButton}
      </DialogContent>
    </Dialog>
  );
};
