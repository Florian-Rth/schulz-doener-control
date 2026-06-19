import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { type FC, useState } from "react";
import { MaterialIcon, PrimaryButton } from "@/components";
import { usersCopy } from "../../../copy";
import type { TempPasswordReveal } from "../../../types";

interface TempPasswordDialogProps {
  open: boolean;
  reveal: TempPasswordReveal;
  onClose: () => void;
}

// One-time reveal of a freshly minted temporary password (after create or
// reset). The value is shown in a monospace box with a copy button and a
// German warning that it is visible only once.
export const TempPasswordDialog: FC<TempPasswordDialogProps> = ({ open, reveal, onClose }) => {
  const [copied, setCopied] = useState(false);

  const onCopy = (): void => {
    void navigator.clipboard?.writeText(reveal.temporaryPassword);
    setCopied(true);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: "navy.main" }}>{usersCopy.tempTitle}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
        <Typography sx={{ fontSize: "0.8125rem", color: "muted.main" }}>
          {usersCopy.tempFor(reveal.displayName)}
        </Typography>

        <Stack
          direction="row"
          sx={(theme) => ({
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            px: 1.5,
            py: 1.25,
            borderRadius: `${theme.radii.md}px`,
            backgroundColor: theme.palette.subtle.main,
            border: `1.5px solid ${theme.ds.inputBorder}`,
          })}
        >
          <Typography
            sx={{
              fontFamily: "monospace",
              fontSize: "1.0625rem",
              fontWeight: 700,
              color: "navy.main",
              wordBreak: "break-all",
            }}
          >
            {reveal.temporaryPassword}
          </Typography>
          <IconButton
            onClick={onCopy}
            aria-label={copied ? usersCopy.tempCopied : usersCopy.tempCopy}
          >
            <MaterialIcon name={copied ? "check" : "content_copy"} sx={{ fontSize: 20 }} />
          </IconButton>
        </Stack>

        {copied ? (
          <Typography
            role="status"
            sx={{ fontSize: "0.75rem", color: "success.main", fontWeight: 700 }}
          >
            {usersCopy.tempCopied}
          </Typography>
        ) : null}

        <Typography
          sx={(theme) => ({
            fontSize: "0.8125rem",
            color: "warning.main",
            fontWeight: 600,
            lineHeight: 1.5,
            backgroundColor: theme.ds.orangeTint,
            borderRadius: `${theme.radii.sm}px`,
            px: 1.25,
            py: 1,
          })}
        >
          {usersCopy.tempWarning}
        </Typography>

        <PrimaryButton onClick={onClose} sx={{ mt: 0.5 }}>
          {usersCopy.tempClose}
        </PrimaryButton>
      </DialogContent>
    </Dialog>
  );
};
