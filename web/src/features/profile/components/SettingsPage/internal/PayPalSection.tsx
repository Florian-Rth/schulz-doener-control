import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { type FC, useState } from "react";
import { GhostButton, PrimaryButton } from "@/components";
import { profileCopy } from "../../../copy";
import { useClearPayPalHandle } from "../../../hooks/use-clear-paypal-handle";
import { PayPalHandleForm } from "../../PayPalHandleForm";
import { SettingsCard } from "./SettingsCard";

interface PayPalSectionProps {
  /** The caller's current handle (null = not set, cash-only). */
  payPalHandle: string | null;
}

// "Geld kassieren" card: the existing handle form plus a clear-to-cash action
// that is only offered while a handle is set. Clearing goes through a separate
// mutation call (not the form) so the form's min(1) validation stays intact for
// normal saves; a small confirm dialog spells out the cash-only consequence.
export const PayPalSection: FC<PayPalSectionProps> = ({ payPalHandle }) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { isPending, serverError, clear } = useClearPayPalHandle(() => {
    setConfirmOpen(false);
  });

  const closeConfirm = (): void => {
    setConfirmOpen(false);
  };

  return (
    <SettingsCard>
      <PayPalHandleForm initialHandle={payPalHandle} />

      {payPalHandle !== null ? (
        <GhostButton
          onClick={() => {
            setConfirmOpen(true);
          }}
          sx={{ mt: 0.5 }}
        >
          {profileCopy.clearAction}
        </GhostButton>
      ) : null}

      <Dialog open={confirmOpen} onClose={closeConfirm} fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: "navy.main" }}>
          {profileCopy.clearConfirmTitle}
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Stack sx={{ gap: 0.5, pt: 0.5 }}>
            <Typography sx={{ fontSize: "0.875rem", color: "label.main", lineHeight: 1.5 }}>
              {profileCopy.clearConfirmBody}
            </Typography>

            {serverError !== null ? (
              <Typography
                role="alert"
                sx={{ fontSize: "0.8125rem", color: "primary.main", fontWeight: 600 }}
              >
                {serverError}
              </Typography>
            ) : null}

            <PrimaryButton
              loading={isPending}
              onClick={() => {
                void clear();
              }}
              sx={{ mt: 1.5 }}
            >
              {isPending ? profileCopy.clearPending : profileCopy.clearConfirm}
            </PrimaryButton>
            <GhostButton onClick={closeConfirm} disabled={isPending} sx={{ mt: 1 }}>
              {profileCopy.clearCancel}
            </GhostButton>
          </Stack>
        </DialogContent>
      </Dialog>
    </SettingsCard>
  );
};
