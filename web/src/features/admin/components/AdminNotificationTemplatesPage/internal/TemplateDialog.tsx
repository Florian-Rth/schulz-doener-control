import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { GhostButton, PrimaryButton } from "@/components";
import { templatesCopy } from "../../../copy";
import { useNotificationTemplateForm } from "../../../hooks/use-notification-template-form";
import type { AdminNotificationTemplate } from "../../../types";
import { TemplateTextField } from "./TemplateTextField";
import { TemplateToggleField } from "./TemplateToggleField";

interface TemplateDialogProps {
  open: boolean;
  /** The template being edited; omit to provision a new one. */
  template?: AdminNotificationTemplate;
  onClose: () => void;
  onSaved: () => void;
}

// Create/edit notification-text dialog. One form serves both modes. Logic lives in
// `useNotificationTemplateForm`; this composes the fields + actions.
export const TemplateDialog: FC<TemplateDialogProps> = ({ open, template, onClose, onSaved }) => {
  const { form, onSubmit, isPending, serverError, isEdit } = useNotificationTemplateForm({
    template,
    onSaved,
  });

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: "navy.main" }}>
        {isEdit ? templatesCopy.editTitle : templatesCopy.createTitle}
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Stack component="form" noValidate onSubmit={onSubmit} sx={{ gap: 0.5, pt: 0.5 }}>
          <TemplateTextField
            control={form.control}
            name="synonym"
            label={templatesCopy.synonymLabel}
            placeholder={templatesCopy.synonymPlaceholder}
          />
          <TemplateTextField
            control={form.control}
            name="body"
            label={templatesCopy.bodyLabel}
            placeholder={templatesCopy.bodyPlaceholder}
            multiline
          />
          <TemplateToggleField control={form.control} label={templatesCopy.activeLabel} />

          {serverError !== null ? (
            <Typography
              role="alert"
              sx={{ fontSize: "0.8125rem", color: "primary.main", fontWeight: 600, mt: 1 }}
            >
              {serverError}
            </Typography>
          ) : null}

          <PrimaryButton type="submit" loading={isPending} sx={{ mt: 1.5 }}>
            {isEdit
              ? isPending
                ? templatesCopy.editSubmitting
                : templatesCopy.editSubmit
              : isPending
                ? templatesCopy.createSubmitting
                : templatesCopy.createSubmit}
          </PrimaryButton>
          <GhostButton onClick={onClose} disabled={isPending} sx={{ mt: 1 }}>
            {templatesCopy.cancel}
          </GhostButton>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};
