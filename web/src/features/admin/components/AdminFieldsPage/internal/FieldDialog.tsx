import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { FC } from "react";
import { useWatch } from "react-hook-form";
import { GhostButton, PrimaryButton } from "@/components";
import { fieldsCopy } from "../../../copy";
import { useFieldForm } from "../../../hooks/use-field-form";
import type { AdminField } from "../../../types";
import { FieldSelectField } from "./FieldSelectField";
import { FieldTextField } from "./FieldTextField";
import { FIELD_DISPLAY_OPTIONS, FIELD_TYPE_OPTIONS } from "./field-options";

interface FieldDialogProps {
  open: boolean;
  /** The field being edited; omit to provision a new one. */
  field?: AdminField;
  onClose: () => void;
  onSaved: () => void;
}

// Create/edit field dialog. One form serves both modes; on edit the key and type are read-only. The
// maxLength input only appears for text fields. Logic lives in `useFieldForm`.
export const FieldDialog: FC<FieldDialogProps> = ({ open, field, onClose, onSaved }) => {
  const { form, onSubmit, isPending, serverError, isEdit } = useFieldForm({ field, onSaved });
  const type = useWatch({ control: form.control, name: "type" });

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle sx={{ fontWeight: 700, color: "navy.main" }}>
        {isEdit ? fieldsCopy.editTitle : fieldsCopy.createTitle}
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Stack component="form" noValidate onSubmit={onSubmit} sx={{ gap: 0.5, pt: 0.5 }}>
          <FieldTextField
            control={form.control}
            name="key"
            label={fieldsCopy.keyLabel}
            placeholder={fieldsCopy.keyPlaceholder}
            helperText={isEdit ? fieldsCopy.keyLocked : undefined}
            disabled={isEdit}
          />
          <FieldTextField
            control={form.control}
            name="label"
            label={fieldsCopy.labelLabel}
            placeholder={fieldsCopy.labelPlaceholder}
          />
          <FieldSelectField
            control={form.control}
            name="type"
            label={fieldsCopy.typeLabel}
            options={FIELD_TYPE_OPTIONS}
            disabled={isEdit}
            helperText={isEdit ? fieldsCopy.typeLocked : undefined}
          />
          <FieldSelectField
            control={form.control}
            name="display"
            label={fieldsCopy.displayLabel}
            options={FIELD_DISPLAY_OPTIONS}
          />
          {type === "text" ? (
            <FieldTextField
              control={form.control}
              name="maxLength"
              label={fieldsCopy.maxLengthLabel}
              helperText={fieldsCopy.maxLengthHint}
              numeric
              nullable
            />
          ) : null}

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
                ? fieldsCopy.editSubmitting
                : fieldsCopy.editSubmit
              : isPending
                ? fieldsCopy.createSubmitting
                : fieldsCopy.createSubmit}
          </PrimaryButton>
          <GhostButton onClick={onClose} disabled={isPending} sx={{ mt: 1 }}>
            {fieldsCopy.cancel}
          </GhostButton>
        </Stack>
      </DialogContent>
    </Dialog>
  );
};
